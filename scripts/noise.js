import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'

/**
 *  Todo
 */
export class Noise {

  static F2 = 0.5 * (Math.sqrt(3.0) - 1.0)
  static G2 = (3.0 - Math.sqrt(3.0)) / 6.0
  static F3 = 1.0 / 3.0
  static G3 = 1.0 / 6.0
  static F4 = (Math.sqrt(5.0) - 1.0) / 4.0
  static G4 = (5.0 - Math.sqrt(5.0)) / 20.0

  /**
   * Is making this faster but I get ~5 million ops/sec more on the benchmarks across the board or a ~10% speedup.
   * @param {*} x 
   * @returns 
   */
  static fastFloor(x) {
    return Math.floor(x) | 0
  }

  /**
   * Get default mulberry rom implementation of unified perlin noise
   * @param {*} seed 
   * @returns 
   */
  static getMulberry32(seed) {
    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  static grad2 = new Float64Array(
    [1, 1,
    -1, 1,
    1, -1,

    -1, -1,
    1, 0,
    -1, 0,

    1, 0,
    -1, 0,
    0, 1,

    0, -1,
    0, 1,
    0, -1]
  )

  /**
   * Samples the noise field in two dimensions and creates a 2D noise function
   * 
   * @param x - Coordinates should be finite, bigger than -2^31 and smaller than 2^31.
   * @param y
   * @returns a number in the interval [-1, 1]
   * @param random the random function that will be used to build the permutation table
   * @returns {TODO}
   */
  static createNoise2D(seed) {
    const perm = Noise._buildPermutationTable(seed)
    // precalculating this yields a little ~3% performance improvement.
    const permGrad2x = new Float64Array(perm).map(v => Noise.grad2[(v % 12) * 2])
    const permGrad2y = new Float64Array(perm).map(v => Noise.grad2[(v % 12) * 2 + 1])

    return function (x, y) {
      // if(!isFinite(x) || !isFinite(y)) return 0;
      let n0 = 0 // Noise contributions from the three corners
      let n1 = 0
      let n2 = 0

      // Skew the input space to determine which simplex cell we're in
      const s = (x + y) * Noise.F2 // Hairy factor for 2D
      const i = Noise.fastFloor(x + s)
      const j = Noise.fastFloor(y + s)
      const t = (i + j) * Noise.G2
      const X0 = i - t // Unskew the cell origin back to (x,y) space
      const Y0 = j - t
      const x0 = x - X0 // The x,y distances from the cell origin
      const y0 = y - Y0

      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      let i1, j1 // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        i1 = 1
        j1 = 0
      } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {
        i1 = 0
        j1 = 1
      } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      const x1 = x0 - i1 + Noise.G2 // Offsets for middle corner in (x,y) unskewed coords
      const y1 = y0 - j1 + Noise.G2
      const x2 = x0 - 1.0 + 2.0 * Noise.G2 // Offsets for last corner in (x,y) unskewed coords
      const y2 = y0 - 1.0 + 2.0 * Noise.G2
      // Work out the hashed gradient indices of the three simplex corners
      const ii = i & 255
      const jj = j & 255
      // Calculate the contribution from the three corners
      let t0 = 0.5 - x0 * x0 - y0 * y0
      if (t0 >= 0) {
        const gi0 = ii + perm[jj]
        const g0x = permGrad2x[gi0]
        const g0y = permGrad2y[gi0]
        t0 *= t0
        // n0 = t0 * t0 * (grad2[gi0] * x0 + grad2[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        n0 = t0 * t0 * (g0x * x0 + g0y * y0)
      }
      let t1 = 0.5 - x1 * x1 - y1 * y1
      if (t1 >= 0) {
        const gi1 = ii + i1 + perm[jj + j1]
        const g1x = permGrad2x[gi1]
        const g1y = permGrad2y[gi1]
        t1 *= t1
        // n1 = t1 * t1 * (grad2[gi1] * x1 + grad2[gi1 + 1] * y1)
        n1 = t1 * t1 * (g1x * x1 + g1y * y1)
      }
      let t2 = 0.5 - x2 * x2 - y2 * y2
      if (t2 >= 0) {
        const gi2 = ii + 1 + perm[jj + 1]
        const g2x = permGrad2x[gi2]
        const g2y = permGrad2y[gi2]
        t2 *= t2
        // n2 = t2 * t2 * (grad2[gi2] * x2 + grad2[gi2 + 1] * y2);
        n2 = t2 * t2 * (g2x * x2 + g2y * y2)
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2)
    }
  }

  /**
   * Builds a random permutation table.
   * This is exported only for (internal) testing purposes.
   * Do not rely on this export.
   * 
   * @private
   */
  static _buildPermutationTable(seed) {
    const rng = Noise.getMulberry32(seed)
    const tableSize = 512;
    const p = new Uint8Array(tableSize);
    for (let i = 0; i < tableSize / 2; i++) {
      p[i] = i;
    }
    for (let i = 0; i < tableSize / 2 - 1; i++) {
      const r = i + ~~(rng() * (256 - i));
      const aux = p[i];
      p[i] = p[r];
      p[r] = aux;
    }
    for (let i = 256; i < tableSize; i++) {
      p[i] = p[i - 256];
    }
    return p;
  }

}

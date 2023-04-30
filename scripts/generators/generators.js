/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
This software has been made possible by my loving husband, who supports my hobbies by creating freetime for me. <3

You may obtain a copy of the License at:
https://creativecommons.org/licenses/by-sa/4.0/legalcode

Code written by BlackStripedOne can be found at:
https://github.com/BlackStripedOne

This source is part of the SceneWeather module for FoundryVTT virtual tabletop game that can be found at:
https://github.com/BlackStripedOne/fvtt-scene-weather

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

export class Generators {
  /**
   * Scale all values in a given emmitter configuration list by a given factor
   *
   * @param {*} values - the emitter config values list
   * @param {*} factor - the scaling factor
   */
  static _scaleValues(values, factor) {
    values.list = values.list.map((value) => ({
      ...value,
      value: value.value * factor
    }))
  }

  /**
   * Scale a range, containing min and max by a given factor
   *
   * @param {*} range - the range object, containing a min and max key
   * @param {*} factor - the scaling factor
   */
  static _scaleRange(range, factor) {
    range.min = range.min * factor
    range.max = range.max * factor
  }

  /**
   * Transposes a rectangles position of origin ( upper, left corner ) of a given rectangle by the given amount in the given direction
   *
   * @param {number} x - origin rectangle
   * @param {number} y - origin rectangle
   * @param {number} width - origin rectangle width
   * @param {number} height - origin rectangle hight
   * @param {number} distance - distance for transposition based from center to center
   * @param {number} angle - the transposition angle
   * @returns - an object contining the keys x and y with the transposted positions of origin
   */
  static _getTransposedPosition(x, y, width, height, distance, angle) {
    // calculate the center point of the original rectangle
    const centerX = x + width / 2
    const centerY = y + height / 2
    // calculate the new center point based on the distance and angle
    const angleInRadians = (angle * Math.PI) / 180 // Convert to radians
    const newX = centerX + distance * Math.cos(angleInRadians)
    const newY = centerY + distance * Math.sin(angleInRadians)
    return {
      x: newX - width / 2,
      y: newY - height / 2
    }
  }

  /**
   * Apply scene specific settings to generic particle emitter configuration
   *
   * @param {*} options - the generator options to be applied to the generic emitter configuration specified
   * @param {*} config - the emitter configuration which shall have the generator options applied to
   */
  static applyGeneratorToEmitterConfig(options, config) {
    const spawnOffset = 2 / 3
    const sceneRect = canvas.dimensions.sceneRect

    // Adjust the maximum amount of particles based on the canvas dimension
    config.maxParticles =
      (canvas.dimensions.width / canvas.dimensions.size) *
      (canvas.dimensions.height / canvas.dimensions.size) *
      options.density

    // moving particles need to have their values adjusted
    const speed = config.behaviors.find(({ type }) => type === 'moveSpeedStatic')?.config
    if (speed !== undefined) {
      const averageSpeed = (speed.min + speed.max) / 2
      const sceneDiagonal = Math.sqrt(
        sceneRect.width * sceneRect.width + sceneRect.height * sceneRect.height
      )
      const averageDiagonalTime = sceneDiagonal / averageSpeed
      const minLifetime = averageDiagonalTime / spawnOffset / 2
      const maxLifetime = averageDiagonalTime / spawnOffset

      // Adjust the lifetime of particles according to the size of the scene diagonal
      config.lifetime = {
        min: minLifetime,
        max: maxLifetime
      }

      // Relative amount of particles and frequency based on density and canvas size
      config.frequency = (minLifetime + maxLifetime) / 2 / config.maxParticles

      // Calculate spawn shape outside the scene area
      const tp = Generators._getTransposedPosition(
        sceneRect.x,
        sceneRect.y,
        sceneRect.width,
        sceneRect.height,
        sceneDiagonal / 4,
        (options.direction + 180) % 360
      )
      config.behaviors.push({
        type: 'spawnShape',
        config: {
          type: 'rect',
          data: {
            x: tp.x,
            y: tp.y,
            w: sceneRect.width,
            h: sceneRect.height
          }
        }
      })
    } else {
      // Frequency just the inverse of maximum particles on scene
      config.frequency = (config.lifetime.min + config.lifetime.max) / 2 / config.maxParticles

      const sceneRect = canvas.dimensions.sceneRect
      // Spawn shape is slightly larger then the whole scene
      config.behaviors.push({
        type: 'spawnShape',
        config: {
          type: 'rect',
          data: {
            x: sceneRect.x - sceneRect.width / 4,
            y: sceneRect.y - sceneRect.height / 4,
            w: sceneRect.width * 1.5,
            h: sceneRect.height * 1.5
          }
        }
      })
    }

    // Scale alpha values
    if (options['alpha'] !== undefined) {
      config.behaviors
        .filter((behavior) => behavior.type === 'alpha')
        .forEach(({ config }) => Generators._scaleValues(config.alpha, options.alpha))
    }

    // Scale spatial dimensions to scene dimensions
    let sceneDimensionFactor = options.scale * (canvas.dimensions.size / 100)
    config.behaviors
      .filter((behavior) => behavior.type === 'scale')
      .forEach(({ config }) => Generators._scaleValues(config.scale, sceneDimensionFactor))

    config.behaviors
      .filter((behavior) => behavior.type === 'scaleStatic')
      .forEach(({ config }) => Generators._scaleRange(config, sceneDimensionFactor))

    // Scale temporal dimensions to scene dimensions
    sceneDimensionFactor = options.speed * (canvas.dimensions.size / 100)
    config.behaviors
      .filter((behavior) => ['moveSpeed', 'movePath'].includes(behavior.type))
      .forEach(({ config }) => Generators._scaleValues(config.speed, sceneDimensionFactor))
    config.behaviors
      .filter((behavior) => behavior.type === 'moveSpeedStatic')
      .forEach(({ config }) => Generators._scaleRange(config, sceneDimensionFactor))
    Generators._scaleRange(config.lifetime, 1 / sceneDimensionFactor)
    config.frequency /= sceneDimensionFactor

    // Set emitters direction direction
    const direction = options.direction
    if (direction !== undefined) {
      config.behaviors
        .filter((behavior) => behavior.type === 'rotation')
        .forEach(({ config }) => {
          const range = config.maxStart - config.minStart
          config.minStart = direction - range / 2
          config.maxStart = direction + range / 2
        })

      config.behaviors
        .filter((behavior) => behavior.type === 'rotationStatic')
        .forEach(({ config }) => {
          const range = config.max - config.min
          config.min = direction - range / 2
          config.max = direction + range / 2
        })
    }

    // Scale emitters lifetime
    const lifetimeFactor = options.lifetime
    Generators._scaleRange(config.lifetime, lifetimeFactor)
    config.frequency *= lifetimeFactor

    // Apply color tint to particles
    if (options.tint != null) {
      config.behaviors = config.behaviors
        .filter(({ type }) => type !== 'color' && type !== 'colorStatic')
        .concat({
          type: 'colorStatic',
          config: {
            color: options.tint
          }
        })
    }
  }
}

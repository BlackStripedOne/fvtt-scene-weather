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

import { Noise } from '../../scripts/noise.js'

describe('Noise.fastFloor', () => {
  it('returns the floor of a positive number', () => {
    expect(Noise.fastFloor(3.5)).toEqual(3)
  })

  it('returns the floor of a negative number', () => {
    expect(Noise.fastFloor(-2.7)).toEqual(-3)
  })

  it('returns 0 for 0', () => {
    expect(Noise.fastFloor(0)).toEqual(0)
  })

  it('returns the correct value for small numbers', () => {
    expect(Noise.fastFloor(1e-15)).toEqual(0)
  })
})

describe('Noise.getMulberry32', () => {
  it('should generate random numbers between 0 and 1', () => {
    const seed = 12_345
    const random = Noise.getMulberry32(seed)
    const NUM_ITERATIONS = 1000
    for (let i = 0; i < NUM_ITERATIONS; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('should generate different sequences for different seeds', () => {
    const seed1 = 12_345
    const seed2 = 54_321
    const random1 = Noise.getMulberry32(seed1)
    const random2 = Noise.getMulberry32(seed2)
    const NUM_ITERATIONS = 100
    const values1 = []
    const values2 = []
    for (let i = 0; i < NUM_ITERATIONS; i++) {
      values1.push(random1())
      values2.push(random2())
    }
    expect(values1).not.toEqual(values2)
  })
})

describe('Noise.getNoisedValue', () => {
  let gameSettingsGetMock

  beforeEach(() => {
    gameSettingsGetMock = jest.spyOn(game.settings, 'get').mockImplementation(() => 'trace')
    // Set up a spy on the game.settings.get() method, which returns null by default
  })

  afterEach(() => {
    gameSettingsGetMock.mockRestore()
    // Restore the original implementation of game.settings.get() after each test
  })

  test('returns a number', () => {
    const noiseFunction = Noise.createNoise2D(Math.random(100_000))
    const result = Noise.getNoisedValue(noiseFunction, 123, 1, 0, 1)
    expect(typeof result).toBe('number')
  })

  test('returns a value within the expected range', () => {
    const noiseFunction = Noise.createNoise2D(Math.random(100_000))
    const result = Noise.getNoisedValue(noiseFunction, 123, 1, 0, 1)
    expect(result).toBeGreaterThanOrEqual(-1)
    expect(result).toBeLessThanOrEqual(1)
  })

  test('returns a value that varies with the variation parameter', () => {
    const baseValue = 10
    const variation = 5
    const noiseFunction = Noise.createNoise2D(Math.random(100_000))
    const timeHash = 123
    const mainAmpli = 1
    const n = 0.4
    const result1 = Noise.getNoisedValue(noiseFunction, timeHash, mainAmpli, baseValue, variation)
    const result2 = Noise.getNoisedValue(noiseFunction, timeHash, mainAmpli, baseValue, variation)
    expect(result1).toBeCloseTo(result2, 2)
    expect(result1).toBeGreaterThanOrEqual(baseValue - variation)
    expect(result1).toBeLessThanOrEqual(baseValue + variation)
  })
})

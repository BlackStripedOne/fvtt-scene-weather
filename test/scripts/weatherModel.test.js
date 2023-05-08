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

import { WeatherModel } from '../../scripts/weatherModel.js'
import { SceneWeatherState } from '../../scripts/state.js'

describe('WeatherModel constructor', () => {
  let gameSettingsGetMock
  let sceneFlagSetMock

  beforeEach(() => {
    gameSettingsGetMock = jest.spyOn(game.settings, 'get').mockImplementation((module, key) => {
      switch (key) {
        case 'loglevel':
          return 'trace'
        case 'defaultWeatherSettings':
          return {
            wind: {
              speed: 12
            },
            temp: {
              ground: 10
            },
            clouds: {
              coverage: 0.34
            },
            precipitation: {
              amount: 0.12,
              mode: 0
            },
            sun: {
              amount: 0.45
            }
          }
        default:
          return null
      }
    })

    sceneFlagSetMock = jest.spyOn(canvas.scene, 'setFlag').mockImplementation(() => true)
  })

  afterEach(() => {
    gameSettingsGetMock.mockRestore()
    sceneFlagSetMock.mockRestore()
  })

  test('should initialize cache and set regionMeteo if provided', () => {
    const regionMeteo = {
      updateConfig: jest.fn()
    }
    const useWeatherConfig = undefined
    const templateId = undefined
    const sceneWeatherState = new WeatherModel({ regionMeteo, useWeatherConfig, templateId })
    expect(sceneWeatherState._cache).toEqual({})
    expect(sceneWeatherState.regionMeteo).toEqual(regionMeteo)
    expect(sceneWeatherState.useConfigSceneId).toBeUndefined()
  })

  test('should initialize cache and set useConfigSceneId if useWeatherConfig is provided', () => {
    const regionMeteo = undefined
    const useWeatherConfig = 'sceneId'
    const templateId = undefined
    const sceneWeatherState = new WeatherModel({ regionMeteo, useWeatherConfig, templateId })
    expect(sceneWeatherState._cache).toEqual({})
    expect(sceneWeatherState.regionMeteo).toBeUndefined()
    expect(sceneWeatherState.useConfigSceneId).toEqual(useWeatherConfig)
  })

  test('should initialize cache and set weatherData if templateId is provided', () => {
    SceneWeatherState._weatherTemplates = [
      {
        _id: 'test',
        name: 'testName',
        precipitation: {
          mode: 0
        }
      }
    ]
    const regionMeteo = undefined
    const useWeatherConfig = undefined
    const templateId = 'myTemplateId'
    const sceneWeatherState = new WeatherModel({ regionMeteo, useWeatherConfig, templateId })
    expect(sceneWeatherState._cache).toEqual({})
    expect(sceneWeatherState.regionMeteo).toBeUndefined()
    expect(sceneWeatherState.useConfigSceneId).toBeUndefined()
    expect(sceneWeatherState.weatherData).toBeDefined()
    expect(sceneWeatherState.weatherData.source).toEqual('_TEMPLATE_')
  })
})

describe('WeatherModel', () => {
  describe('getTemplates', () => {
    it('should return an array of objects with id and name properties', () => {
      const templates = WeatherModel.getTemplates()
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
      for (const template of templates) {
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('name')
      }
    })
  })
})

describe('WeatherModel._getNoisedWindDirection', () => {
  let gameSettingsGetMock
  let sceneFlagSetMock

  beforeEach(() => {
    gameSettingsGetMock = jest.spyOn(game.settings, 'get').mockImplementation((module, key) => {
      switch (key) {
        case 'loglevel':
          return 'trace'
        case 'defaultWeatherSettings':
          return {
            wind: {
              speed: 12
            },
            temp: {
              ground: 10
            },
            clouds: {
              coverage: 0.34
            },
            precipitation: {
              amount: 0.12,
              mode: 0
            },
            sun: {
              amount: 0.45
            }
          }
        default:
          return null
      }
    })

    sceneFlagSetMock = jest.spyOn(canvas.scene, 'setFlag').mockImplementation(() => true)
  })

  afterEach(() => {
    gameSettingsGetMock.mockRestore()
    sceneFlagSetMock.mockRestore()
  })

  it('should return a wind direction value between 0 and 360 degrees', () => {
    const regionMeteo = undefined
    const useWeatherConfig = 'sceneId'
    const templateId = undefined
    const weatherModel = new WeatherModel({ regionMeteo, useWeatherConfig, templateId })
    const timeHash = 123_456
    const gusts = 10
    const windDirection = weatherModel._getNoisedWindDirection(timeHash, gusts)

    expect(windDirection).toBeGreaterThanOrEqual(0)
    expect(windDirection).toBeLessThanOrEqual(360)
  })

  it('should return a different wind direction value when called with different timeHash and gusts values', () => {
    const regionMeteo = undefined
    const useWeatherConfig = 'sceneId'
    const templateId = undefined
    const weatherModel = new WeatherModel({ regionMeteo, useWeatherConfig, templateId })
    const timeHash1 = 123_456
    const gusts1 = 10
    const windDirection1 = weatherModel._getNoisedWindDirection(timeHash1, gusts1)

    const timeHash2 = 654_321
    const gusts2 = 5
    const windDirection2 = weatherModel._getNoisedWindDirection(timeHash2, gusts2)

    expect(windDirection1).not.toEqual(windDirection2)
  })
})

describe('WeatherModel._groundTemp()', () => {
  let gameSettingsGetMock
  let sceneFlagSetMock

  beforeEach(() => {
    gameSettingsGetMock = jest.spyOn(game.settings, 'get').mockImplementation((module, key) => {
      switch (key) {
        case 'loglevel':
          return 'trace'
        case 'defaultWeatherSettings':
          return {
            wind: {
              speed: 12
            },
            temp: {
              ground: 10
            },
            clouds: {
              coverage: 0.34
            },
            precipitation: {
              amount: 0.12,
              mode: 0
            },
            sun: {
              amount: 0.45
            }
          }
        default:
          return null
      }
    })

    sceneFlagSetMock = jest.spyOn(canvas.scene, 'setFlag').mockImplementation(() => true)
  })

  afterEach(() => {
    gameSettingsGetMock.mockRestore()
    sceneFlagSetMock.mockRestore()
  })

  test('should return the average ground temperature', () => {
    const regionMeteo = {
      getRegionBase: jest.fn().mockImplementation(() => {
        return { baseTemp: 10 }
      }),
      updateConfig: jest.fn()
    }
    const useWeatherConfig = 'sceneId'
    const templateId = undefined
    const weatherModel = new WeatherModel({ regionMeteo, useWeatherConfig, templateId })
    // Define the input parameters
    const steps = 5
    const stepWidth = 2
    const dayOffset = 0
    const hourOffset = 0

    // Define the expected output
    const expectedOutput = 10

    // Call the function and check the output
    const output = weatherModel._groundTemp(steps, stepWidth, dayOffset, hourOffset)
    expect(output).toBe(expectedOutput)
  })
})

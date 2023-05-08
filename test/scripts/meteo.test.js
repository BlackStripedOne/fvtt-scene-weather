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

import { Meteo } from '../../scripts/meteo.js'
import { PRECI_TYPE, CLOUD_TYPE } from '../../scripts/constants.js'
import { Utils } from '../../scripts/utils.js'

afterEach(() => {
  jest.clearAllMocks()
})

// Test suite for the getPrecipitationType function
describe('Meteo.getPrecipitationType', () => {
  // Test for no precipitation
  test('should return PRECI_TYPE.none if precipitationAmount is less than 0.1', () => {
    const result = Meteo.getPrecipitationType(0.05, 1, 10, 0.1)
    expect(result).toBe(PRECI_TYPE.none)
  })

  // Test for CB(4+) with blizzard
  test('should return PRECI_TYPE.blizzard if cloudType is greater than 3, precipitationAmount is greater than 0.7, airTemperature is less than 4, and windSpeed is greater than 0.2', () => {
    const result = Meteo.getPrecipitationType(0.8, 4, -5, 0.3)
    expect(result).toBe(PRECI_TYPE.blizzard)
  })

  // Test for CB(4+) with hail
  test('should return PRECI_TYPE.hail if cloudType is greater than 3, precipitationAmount is greater than 0.7, airTemperature is greater than or equal to 4, and windSpeed is greater than 0.2', () => {
    const result = Meteo.getPrecipitationType(0.8, 4, 10, 0.3)
    expect(result).toBe(PRECI_TYPE.hail)
  })

  // Test for CB(4+) with downpour
  test('should return PRECI_TYPE.downpour if cloudType is greater than 3, precipitationAmount is greater than 0.7, airTemperature is greater than or equal to 4, and windSpeed is less than or equal to 0.2', () => {
    const result = Meteo.getPrecipitationType(0.8, 4, 10, 0.1)
    expect(result).toBe(PRECI_TYPE.downpour)
  })

  // Test for CU(3) with blizzard
  test('should return PRECI_TYPE.blizzard if cloudType is greater than or equal to 3, precipitationAmount is less than or equal to 0.7, airTemperature is less than 4, and windSpeed is greater than 0.2', () => {
    const result = Meteo.getPrecipitationType(0.6, 3, -5, 0.3)
    expect(result).toBe(PRECI_TYPE.blizzard)
  })

  // Test for CU(3) with snow
  test('should return PRECI_TYPE.snow if cloudType is greater than or equal to 3, precipitationAmount is less than or equal to 0.7, airTemperature is less than 4, and windSpeed is less than or equal to 0.2', () => {
    const result = Meteo.getPrecipitationType(0.6, 3, -5, 0.1)
    expect(result).toBe(PRECI_TYPE.snow)
  })

  // Test for CU(3) with rain
  test('should return PRECI_TYPE.rain if cloudType is greater than or equal to 3, precipitationAmount is greater than 0.7, and airTemperature is greater than or equal to 4', () => {
    const result = Meteo.getPrecipitationType(0.8, 3, 10, 0.1)
    expect(result).toBe(PRECI_TYPE.rain)
  })

  // Test for ST(2) with snow
  test('should return PRECI_TYPE.snow if cloudType is 2, airTemperature is less than 4', () => {
    const result = Meteo.getPrecipitationType(0.5, 2, -5, 0.1)
    expect(result).toBe(PRECI_TYPE.snow)
  })

  // Test for ST(2) with drizzle
  test('should return PRECI_TYPE.drizzle if cloudType is 2 and airTemperature is greater than or equal to 4', () => {
    const result = Meteo.getPrecipitationType(0.5, 2, 10, 0.1)
    expect(result).toBe(PRECI_TYPE.drizzle)
  })

  // Test for FG(1) with snow
  test('should return PRECI_TYPE.snow if cloudType is less than 2, precipitationAmount is greater than 0.7, and airTemperature is less than 4', () => {
    const result = Meteo.getPrecipitationType(0.8, 1, -5, 0.1)
    expect(result).toBe(PRECI_TYPE.snow)
  })

  // Test for FG(1) with drizzle
  test('should return PRECI_TYPE.drizzle if cloudType is less than 2, precipitationAmount is greater than 0.7, and airTemperature is greater than or equal to 4', () => {
    const result = Meteo.getPrecipitationType(0.8, 1, 10, 0.1)
    expect(result).toBe(PRECI_TYPE.drizzle)
  })

  // Test for no precipitation with precipitationAmount between 0.1 and 0.7
  test('should return PRECI_TYPE.none if precipitationAmount is between 0.1 and 0.7 and cloudType is less than or equal to 2', () => {
    const result = Meteo.getPrecipitationType(0.5, 1, 20, 0.1)
    expect(result).toBe(PRECI_TYPE.none)
  })
})

// elevation, bottom, top, coverage, tempCoefficient
describe('Meteo.getCloudType', () => {
  test('should return "fog" if bottom is less than elevation', () => {
    const cloudType = Meteo.getCloudType(500, 200, 800, 0.2, 0.5)
    expect(cloudType).toBe(CLOUD_TYPE.fog)
  })

  test('should return "cumulus" if tempCoefficient is less than 0 and top-bottom is greater than 1000', () => {
    const cloudType = Meteo.getCloudType(0, 500, 2500, 0.5, -0.5)
    expect(cloudType).toBe(CLOUD_TYPE.cumulus)
  })

  test('should return "cumulunimbus" if tempCoefficient is greater than 0 and top-bottom is greater than 3000', () => {
    const cloudType = Meteo.getCloudType(0, 500, 4500, 0.5, -0.5)
    expect(cloudType).toBe(CLOUD_TYPE.cumulunimbus)
  })

  test('should return "stratus" if coverage is greater than 0.3', () => {
    const cloudType = Meteo.getCloudType(0, 500, 1000, 0.5, 0.5)
    expect(cloudType).toBe(CLOUD_TYPE.stratus)
  })

  test('should return "none" if none of the conditions are met', () => {
    const cloudType = Meteo.getCloudType(0, 500, 1500, 0.0, 0.5)
    expect(cloudType).toBe(CLOUD_TYPE.none)
  })
})

describe('Meteo.calcCloudCoverage', () => {
  // Test case 1: Test for a valid input
  test('should return the correct cloud cover rate for valid input', () => {
    const bottom = 1000 // set the bottom height of the cloud layer
    const top = 1500 // set the top height of the cloud layer
    const expected = 1
    const result = Meteo.calcCloudCoverage(bottom, top) // call the calcCloudCoverage function with the input values
    expect(result).toBe(expected) // compare the result with the expected output
  })

  // Test case 2: Test for a cloud layer with zero thickness
  test('should return zero for a cloud layer with zero thickness', () => {
    const bottom = 1000 // set the bottom height of the cloud layer
    const top = 1000 // set the top height of the cloud layer
    const expected = 0 // expected output based on the formula (1000 - 1000) / 100 = 0 * 0.1 = 0
    const result = Meteo.calcCloudCoverage(bottom, top) // call the calcCloudCoverage function with the input values
    expect(result).toBe(expected) // compare the result with the expected output
  })

  // Test case 3: Test for a cloud layer with maximum thickness
  test('should return one for a cloud layer with maximum thickness', () => {
    const bottom = 1000 // set the bottom height of the cloud layer
    const top = 2000 // set the top height of the cloud layer
    const expected = 1 // expected output based on the formula (2000 - 1000) / 100 = 10 * 0.1 = 1
    const result = Meteo.calcCloudCoverage(bottom, top) // call the calcCloudCoverage function with the input values
    expect(result).toBe(expected) // compare the result with the expected output
  })

  it('calls the clamp function with the correct arguments', () => {
    // Start another Jest test case with a descriptive title
    const bottom = 1000 // Define the bottom of the cloud layer in meters
    const top = 2000 // Define the top of the cloud layer in meters
    const expectedCoverage = 1
    const clampSpy = jest.spyOn(Utils, 'clamp') // Spy on the clamp function in the Utils module
    jest.clearAllMocks()
    const actualCoverage = Meteo.calcCloudCoverage(bottom, top) // Call the calcCloudCoverage function with the defined inputs
    expect(clampSpy).toHaveBeenCalledWith(10, 0, 1) // Check that the clamp function was called with the actual coverage value and the expected minimum and maximum values of 0 and 1, respectively
    expect(actualCoverage).toBe(expectedCoverage) // Check that the actual coverage is equal to the expected coverage of 0.5
    clampSpy.mockRestore() // Restore the original implementation of the clamp function after the test is finished
  })
})

describe('Meteo.calcGeopotential()', () => {
  it('should return a number', () => {
    const result = Meteo.calcGeopotential(1, 1, 1, 1)
    expect(typeof result).toBe('number')
  })

  it('should calculate geopotential correctly', () => {
    const result = Meteo.calcGeopotential(1, 1, 1, 1)
    expect(result).toBeCloseTo(3.6, 2)

    const result2 = Meteo.calcGeopotential(2, 2, 2, 2)
    expect(result2).toBeCloseTo(13.8, 2)

    const result3 = Meteo.calcGeopotential(0, 0, 0, 0)
    expect(result3).toBe(0)
  })

  it('should handle negative inputs correctly', () => {
    const result = Meteo.calcGeopotential(-1, -1, -1, -1)
    expect(result).toBeCloseTo(3, 2)
  })

  it('should handle edge cases correctly', () => {
    const result = Meteo.calcGeopotential(0, 1, 0, 1)
    expect(result).toBeCloseTo(0.3, 2)

    const result2 = Meteo.calcGeopotential(1, 0, 0, 0)
    expect(result2).toBeCloseTo(0, 2)

    const result3 = Meteo.calcGeopotential(0, 0, 1, 0)
    expect(result3).toBeCloseTo(0, 2)

    const result4 = Meteo.calcGeopotential(0, 0, 0, 1)
    expect(result4).toBeCloseTo(0, 2)
  })
})

describe('Meteo.calcCloudTops', () => {
  it('calculates cloud tops correctly for positive temperature coefficient', () => {
    const tempCoifficient = 1
    const cloudBottom = 1000
    const vegetation = 30
    const sunAmount = 0.8
    const wind = 10
    const waterAmount = 0.5
    const expectedTops = 1066.9438

    const tops = Meteo.calcCloudTops(
      tempCoifficient,
      cloudBottom,
      vegetation,
      sunAmount,
      wind,
      waterAmount
    )

    expect(tops).toBe(expectedTops)
  })

  it('calculates cloud tops correctly for negative temperature coefficient', () => {
    const tempCoifficient = -1
    const cloudBottom = 1000
    const vegetation = 60
    const sunAmount = 0.5
    const wind = 20
    const waterAmount = 0.2
    const expectedTops = 12_142.81

    const tops = Meteo.calcCloudTops(
      tempCoifficient,
      cloudBottom,
      vegetation,
      sunAmount,
      wind,
      waterAmount
    )

    expect(tops).toBe(expectedTops)
  })

  it('returns NaN when any input is missing', () => {
    const tempCoifficient = 1
    const cloudBottom = 1000
    const vegetation = 30
    const sunAmount = 0.8
    const wind = 10

    const tops = Meteo.calcCloudTops(tempCoifficient, cloudBottom, vegetation, sunAmount, wind)

    expect(tops).toBeNaN()
  })
})

describe('Meteo.liftedCondensationLevel', () => {
  // Test case 1: Td calculation
  test('should calculate Td correctly', () => {
    expect(Meteo.liftedCondensationLevel(30, 50)).toBe(1250)
  })

  // Test case 2: Td calculation with extreme temperature and humidity
  test('should calculate Td correctly with extreme temperature and humidity', () => {
    expect(Meteo.liftedCondensationLevel(-40, 100)).toBe(0)
  })

  // Test case 3: Lifted condensation level calculation
  test('should calculate lifted condensation level correctly', () => {
    expect(Meteo.liftedCondensationLevel(20, 70)).toBe(750)
  })

  // Test case 4: Lifted condensation level calculation with extreme temperature and humidity
  test('should calculate lifted condensation level correctly with extreme temperature and humidity', () => {
    expect(Meteo.liftedCondensationLevel(50, 0)).toBe(2500)
  })

  // Test case 5: Negative humidity input
  test('should throw error when humidity is negative', () => {
    expect(() => Meteo.liftedCondensationLevel(25, -20)).toThrow()
  })

  // Test case 6: Humidity input over 100%
  test('should throw error when humidity is greater than 100', () => {
    expect(() => Meteo.liftedCondensationLevel(25, 110)).toThrow()
  })
})

describe('Meteo.calculateRelativeHumidityTransfer', () => {
  test('should return the correct new relative humidity when the new temperature is higher', () => {
    const temperatureInCelsius = 25
    const relativeHumidity = 50
    const newTemperatureInCelsius = 30
    const expectedNewRelativeHumidity = 37
    const newRelativeHumidity = Meteo.calculateRelativeHumidityTransfer(
      temperatureInCelsius,
      relativeHumidity,
      newTemperatureInCelsius
    )
    expect(newRelativeHumidity).toBeCloseTo(expectedNewRelativeHumidity)
  })

  test('should return the correct new relative humidity when the new temperature is lower', () => {
    const temperatureInCelsius = 30
    const relativeHumidity = 70
    const newTemperatureInCelsius = 25
    const expectedNewRelativeHumidity = 94
    const newRelativeHumidity = Meteo.calculateRelativeHumidityTransfer(
      temperatureInCelsius,
      relativeHumidity,
      newTemperatureInCelsius
    )
    expect(newRelativeHumidity).toBeCloseTo(expectedNewRelativeHumidity)
  })

  test('should return 0 when the actual vapor pressure is 0', () => {
    const temperatureInCelsius = 20
    const relativeHumidity = 0
    const newTemperatureInCelsius = 25
    const newRelativeHumidity = Meteo.calculateRelativeHumidityTransfer(
      temperatureInCelsius,
      relativeHumidity,
      newTemperatureInCelsius
    )
    expect(newRelativeHumidity).toBe(0)
  })

  test('should return 68 when the actual vapor pressure equals the saturation vapor pressure at the new temperature', () => {
    const temperatureInCelsius = 25
    const relativeHumidity = 50
    const newTemperatureInCelsius = 20
    const newRelativeHumidity = Meteo.calculateRelativeHumidityTransfer(
      temperatureInCelsius,
      relativeHumidity,
      newTemperatureInCelsius
    )
    expect(newRelativeHumidity).toBe(68)
  })

  test('should return the maximum allowed value when the new relative humidity exceeds 100', () => {
    const temperatureInCelsius = 10
    const relativeHumidity = 70
    const newTemperatureInCelsius = 5
    const expectedNewRelativeHumidity = 99
    const newRelativeHumidity = Meteo.calculateRelativeHumidityTransfer(
      temperatureInCelsius,
      relativeHumidity,
      newTemperatureInCelsius
    )
    expect(newRelativeHumidity).toBe(expectedNewRelativeHumidity)
  })

  test('should return the minimum allowed value when the new relative humidity is negative', () => {
    const temperatureInCelsius = -5
    const relativeHumidity = 80
    const newTemperatureInCelsius = -10
    const expectedNewRelativeHumidity = 100
    const newRelativeHumidity = Meteo.calculateRelativeHumidityTransfer(
      temperatureInCelsius,
      relativeHumidity,
      newTemperatureInCelsius
    )
    expect(newRelativeHumidity).toBe(expectedNewRelativeHumidity)
  })
})

describe('Meteo.calcAdiCloudBottomCoeff', () => {
  let gameSettingsGetMock

  beforeEach(() => {
    gameSettingsGetMock = jest.spyOn(game.settings, 'get').mockImplementation(() => 'trace')
    // Set up a spy on the game.settings.get() method, which returns null by default
  })

  afterEach(() => {
    gameSettingsGetMock.mockRestore()
    // Restore the original implementation of game.settings.get() after each test
  })

  test('should calculate adiabatic cloud bottom coefficient correctly', () => {
    // Arrange
    const cloudBottom = 1500 // arbitrary value
    const elevation = 500 // arbitrary value
    const baseTemp = 20 // arbitrary value
    const expectedCoeff = -4 // calculated manually

    // Act
    const actualCoeff = Meteo.calcAdiCloudBottomCoeff(cloudBottom, elevation, baseTemp)

    // Assert
    expect(actualCoeff).toBeCloseTo(expectedCoeff)
  })

  test('should return a negative value when cloud bottom is higher than elevation', () => {
    // Arrange
    const cloudBottom = 2000 // higher than elevation
    const elevation = 1000 // arbitrary value
    const baseTemp = 20 // arbitrary value

    // Act
    const actualCoeff = Meteo.calcAdiCloudBottomCoeff(cloudBottom, elevation, baseTemp)

    // Assert
    expect(actualCoeff).toBeLessThan(0)
  })

  test('should return a negative value when cloud bottom is lower than elevation', () => {
    // Arrange
    const cloudBottom = 500 // lower than elevation
    const elevation = 1000 // arbitrary value
    const baseTemp = 20 // arbitrary value

    // Act
    const actualCoeff = Meteo.calcAdiCloudBottomCoeff(cloudBottom, elevation, baseTemp)

    // Assert
    expect(actualCoeff).toBeLessThan(0)
  })
})

describe('Meteo._dewPoint function', () => {
  test('should return the dew point temperature when input is valid', () => {
    expect(Meteo._dewPoint(25, 60)).toBeCloseTo(16.6842, 2) // example from wikipedia
    expect(Meteo._dewPoint(0, 100)).toBeCloseTo(0, 2) // 100% humidity
    expect(Meteo._dewPoint(60, 100)).toBeCloseTo(60, 2) // 100% humidity at max temperature
  })

  test('should return the same temperature when outside the valid temperature range', () => {
    expect(Meteo._dewPoint(-10, 50)).toEqual(-10) // below valid range
    expect(Meteo._dewPoint(70, 50)).toEqual(70) // above valid range
  })

  test('should return the same temperature when outside the valid humidity range', () => {
    expect(Meteo._dewPoint(25, 0)).toEqual(25) // below valid range
    expect(Meteo._dewPoint(25, 110)).toEqual(25) // above valid range
  })

  test('should return the same temperature when relative temperature is outside the valid range', () => {
    expect(Meteo._dewPoint(25, 10)).toBeCloseTo(25, 2) // below valid range
    expect(Meteo._dewPoint(25, 90)).toBeCloseTo(23.240_626_115_785_112, 2) // above valid range
  })

  test('should handle fractional input values', () => {
    expect(Meteo._dewPoint(25.5, 70.3)).toBeCloseTo(19.684_583_710_471_82, 2)
  })
})

describe('Meteo.heatIndex()', () => {
  it('calculates the heat index accurately', () => {
    // Define a few test cases with known heat index values
    const testCases = [
      { temperature: 80, humidity: 40, expectedHeatIndex: 263.428 },
      { temperature: 85, humidity: 60, expectedHeatIndex: 462.858 },
      { temperature: 90, humidity: 70, expectedHeatIndex: 631.041 },
      { temperature: 95, humidity: 80, expectedHeatIndex: 835.754 }
    ]

    // Loop through each test case and verify the calculated heat index
    for (const { temperature, humidity, expectedHeatIndex } of testCases) {
      const calculatedHeatIndex = Meteo.heatIndex(temperature, humidity)
      expect(calculatedHeatIndex).toBeCloseTo(expectedHeatIndex, 1)
    }
  })
})

describe('Meteo.windChill', () => {
  test('should return the correct wind chill temperature', () => {
    // Test case with moderate wind speed
    expect(Meteo.windChill(10, 20)).toBeCloseTo(7.376, 2)

    // Test case with low wind speed
    expect(Meteo.windChill(10, 2)).toBeCloseTo(9.902, 2)

    // Test case with high wind speed
    expect(Meteo.windChill(10, 200)).toBeCloseTo(10, 2)

    // Test case with minimum wind speed
    expect(Meteo.windChill(10, 4.8)).toBeCloseTo(9.817, 2)

    // Test case with maximum wind speed
    expect(Meteo.windChill(10, 177)).toBeCloseTo(2.383, 2)
  })
})

import { getSceneWeatherAPIv1 } from '../../scripts/api.js'

// Define the test suite using Jest
describe('getSceneWeatherAPIv1', () => {
  // Define a test case for the function
  test('should return an object containing api functions', () => {
    // Call the function and store the result in a variable
    const result = getSceneWeatherAPIv1()

    // Verify if the result is an object
    expect(result).toEqual(expect.any(Object))

    // Verify if the object contains the expected functions
    expect(result.clearScene).toEqual(expect.any(Function))
    expect(result.updateWeatherConfig).toEqual(expect.any(Function))
    expect(result.updateWeather).toEqual(expect.any(Function))
    expect(result.getWeatherModel).toEqual(expect.any(Function))
    expect(result.getWeatherSettings).toEqual(expect.any(Function))
    expect(result.getTokenAmbience).toEqual(expect.any(Function))
    expect(result.setSeed).toEqual(expect.any(Function))
    expect(result.setCycleTimes).toEqual(expect.any(Function))
    expect(result.setWeather).toEqual(expect.any(Function))
    expect(result.setWeatherTemplate).toEqual(expect.any(Function))
    expect(result.setRegion).toEqual(expect.any(Function))
    expect(result.setRegionTemplate).toEqual(expect.any(Function))
    expect(result.registerPerciever).toEqual(expect.any(Function))
    expect(result.registerRegionTemplate).toEqual(expect.any(Function))
    expect(result.registerWeatherTemplate).toEqual(expect.any(Function))
    expect(result.registerWeatherFxGenerator).toEqual(expect.any(Function))
    expect(result.registerWeatherFxFilter).toEqual(expect.any(Function))
    expect(result.version).toEqual('1.0')
  })
})

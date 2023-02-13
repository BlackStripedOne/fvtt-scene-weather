import { Logger, Utils } from './utils.js'


/*
 Input:
 - WeatherModel
 - Config(custom)

 Internal State:
   - "playlist"
    - "weather particle effect"
    - "weather overlay effect"
    - "temperature"
      - "air"
      - "ground"
      - "perceived"
    - "moisture"
    - "wind"
      - "speed"
      - "direction"
      - "gusts"
    - "sun"
      - "intensity"
    - "clouds"
      - "coverage"
      - "tops"
      - "bottoms"
      - "types"
    - "precipitation"
      - "amount"    
      - "type"
 */
export class SceneWeather {

  /**
   * TODO
   * @param {*} weatherModel 
   */
  constructor(weatherModel) {
    this.weatherModel = weatherModel
    Logger.debug('SceneWeather:constrctor', { 'weatherModel': weatherModel })
  }

  /**
   * TODO
   */
  update() {
    this.weatherModel.update()
  }

  /**
   * TODO invoke via layer menu buttons -> see there
   */
  async applyFxToScene() {

  }

  // disableFxOnScene()

  // updateFxOnScene()

  getWeatherInfo(dayOffset = 0, hourOffset = 0) {
    let modelData = this.weatherModel.getWeatherData(dayOffset, hourOffset)
    let weatherInfo = {
      'temperature': modelData.temp.air.toFixed(2),
      'humidity': Math.round(modelData.humidity),
      'wind': {
        'speed': Math.round(modelData.wind.speed),
        'gusts': Math.round(modelData.wind.gusts),
        'direction': 0
      },
      'clouds': {
        'amount': 0,
        'type': 'none'
      },
      'sun': Math.round(modelData.sun.amount),
      'precipitation': {
        'amount': 0,
        'type': 'none'
      }
    }
    return weatherInfo
  }

  /**
 * Convert temperature in fahrenheit to celsius.
 *
 * @param Tf temperature in fahrenheit
 * @returns {number}
 */
  fahrenheitToCelsius(Tf) {
    return (Tf - 32) / 1.8;
  }

  /**
   * Convert temperature in celsius to fahrenheit.
   *
   * @param Tc temperature in celsius
   * @returns {number}
   */
  celsiusToFahrenheit(Tc) {
    return (Tc * 1.8) + 32;
  }

}

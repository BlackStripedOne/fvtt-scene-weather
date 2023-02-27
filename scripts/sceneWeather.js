/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.

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

import { Logger, Utils } from './utils.js'
import { TimeProvider } from './timeProvider.js'
import { MODULE, CLOUD_TYPE, PRECI_TYPE, HUMIDITY_LEVELS, SUN_INTENSITY, PRECI_AMOUNT, WIND_SPEED, CLOUD_HEIGHT, TEMP_TYPES } from './constants.js'
import { WeatherModel } from './weatherModel.js'
import { RegionMeteo } from './regionMeteo.js'

/**
 * This class handles weather conditions for a scene in foundry virtual tabletop.
 */
export class SceneWeather {

  /**
   * Creates a new instance of the WeatherModel class, based on the weather mode selected for the scene.
   *
   * @param {Scene} scene - The scene object for which the weather model needs to be retrieved.
   * @returns {WeatherModel} - A new instance of the WeatherModel class, based on the weather mode selected for the scene.
   * @throws {Error} Will throw an error if the weather mode is invalid.
   */
  constructor(scene) {
    this.sceneId = scene._id
    this.weatherModel = this._getWeatherModelForMode(scene)
    Logger.debug('SceneWeather:constrctor', { 'weatherModel': this.weatherModel, 'sceneId': this.sceneId })
  }

  /**
   * Returns a new instance of the WeatherModel class, based on the weather mode selected for the scene.
   * @param {Scene} scene - The scene object for which the weather model needs to be retrieved.
   * @returns {WeatherModel} - A new instance of the WeatherModel class, based on the weather mode selected for the scene.
   * @throws {Error} Will throw an error if the weather mode is invalid.
   */
  _getWeatherModelForMode(scene) {
    this.weatherMode = scene.getFlag(MODULE.ID, 'weatherMode')
    Logger.debug('SceneWeather._getWeatherModelForMode(...)', { 'scene': scene, 'weatherMode': this.weatherMode })
    switch (this.weatherMode) {
      case 'weatherTemplate':
        // Weather Template (Rainstorm, Thunder, Sunny Breeze, ...) / Time,Date agnostic, static
        const weatherTemplateId = scene.getFlag(MODULE.ID, 'weatherTemplate')
        return WeatherModel.fromTemplate(weatherTemplateId)
      case 'regionTemplate':
        // Region Template (Boreal Forest, Shorelines, Mountains, ...) Time,Date aware
        const regionTemplateId = scene.getFlag(MODULE.ID, 'regionTemplate')
        return WeatherModel.fromRegion(RegionMeteo.fromTemplate(regionTemplateId))
      case 'regionAuto':
        // Region Automatic (Temps, Moists, Winds, ...) Time,Date dependant
        return WeatherModel.fromRegion(new RegionMeteo()) // uses scene config of region and time provided by time provider
      case 'disabled':
      case undefined:
      default:
        throw new Error('Unable to instantiate new SceneWeather, while being disabled.')
    }
  }

  /**
   * Updates the weather configuration for the current scene.
   *
   * @throws {Error} If the scene with the given `sceneId` does not exist.
   *
   * @returns {boolean} `true` if a new weather model was created, `false` otherwise.
   */
  updateConfig() {
    Logger.debug('SceneWeather.updateConfig()', { 'sceneId': this.sceneId })
    const scene = game.scenes.get(this.sceneId)
    if (scene === undefined) {
      Logger.error('Unable to instantiate SceneWeather for non existing Scene with id ' + this.sceneId)
      throw new Error('Unable to instantiate SceneWeather for non existing Scene with id ' + this.sceneId)
    }
    if (scene.getFlag(MODULE.ID, 'weatherMode') != this.weatherMode) {
      // need to set new model here
      Logger.debug('SceneWeather.updateConfig() -> new mode', { 'sceneId': this.sceneId, 'prevMode': this.weatherMode, 'newMode': scene.getFlag(MODULE.ID, 'weatherMode') })

      this.weatherModel = this._getWeatherModelForMode(scene) // TODO may throw Error
      return true
    } else {
      // update existing model
      Logger.debug('SceneWeather.updateConfig() -> unchanged mode', { 'sceneId': this.sceneId })
      return this.weatherModel.updateConfig()
    }
  }

  /**
   * Returns a new SceneWeather instance based on the provided configuration.
   * If no sceneId is provided, the current scene is used instead.
   *
   * @param {Object} [config={}] - The configuration options for the SceneWeather instance.
   * @param {string|null} [config.sceneId=null] - The ID of the scene to create a SceneWeather instance for.
   *
   * @returns {SceneWeather|undefined} - The new SceneWeather instance, or undefined if an error occurred.
   */
  static fromConfig({ sceneId = null } = {}) {
    if (sceneId == null) {
      sceneId = canvas.scene._id
    }
    const scene = game.scenes.get(sceneId)
    if (scene === undefined) {
      Logger.error('Unable to instantiate SceneWeather for non existing Scene with id ' + sceneId)
      return undefined
    }
    try {
      return new SceneWeather(scene)
    } catch (e) {
      return undefined
    }
  }

  /**
   * Calculates weather information based on the weather model data and calls all registered hooks with the updated weather information.
   * @param {Object} options - Optional parameters
   * @param {boolean} options.force - A boolean value indicating whether the weather calculation should be forced
   */
  calculateWeather({ force = false } = {}) {
    const currentTimeHash = TimeProvider.getCurrentTimeHash()
    const modelData = this.weatherModel.getWeatherData()
    const weatherInfo = this._calculateWeatherInfoFromModelData(modelData)

    Hooks.callAll(MODULE.LCCNAME + 'WeatherUpdated', {
      'info': weatherInfo,
      'model': modelData,
      'timeHash': currentTimeHash,
      'sceneId': this.sceneId,
      'force': force
    })
  }

  /**
   * Returns the perceived temperature category based on the input temperature.
   * @param {number} temperature - The temperature value to be categorized.
   * @returns {string} - The category of the perceived temperature.
   */
  static _getPercievedTempId(temperature) {
    const [id] = Object.entries(TEMP_TYPES).find(([, level]) => temperature < level)
    return `meteo.${id}`
  }

  /**
  *
  * Returns the ID of the wind direction based on the input direction angle.
  * @param {number} direction - The wind direction angle in degrees.
  * @returns {string} - The ID of the wind direction in the format "meteo.[direction]" where [direction] is the abbreviated direction name.
  * For example, if the direction is 90 degrees (east), the function will return "meteo.e".
  */
  static _getWindDirId(direction) {
    let val = Math.floor((direction / 22.5) + 0.5)
    const arr = ["n", "nne", "ne", "ene", "e", "ese", "se", "sse", "s", "ssw", "sw", "wsw", "w", "wnw", "nw", "nnw"]
    return "meteo." + arr[(val % 16)]
  }

  /**
   * Returns the cloud height identifier based on the provided height value.
   *
   * @param {number} height - The height value to determine the cloud height identifier for.
   * @returns {string} The cloud height identifier in the format 'meteo.{identifier}'.
  */
  static _getCloudHightId(height) {
    const [id] = Object.entries(CLOUD_HEIGHT).find(([, level]) => height < level)
    return `meteo.${id}`
  }

  /**
   * Returns the meteorological identifier for the cloud amount based on the input amount.
   * @param {number} amount - The amount of cloud cover, a number between 0 and 1.
   * @returns {string} - The meteorological identifier for the cloud amount.
   */
  static _getCloudAmountId(amount) {
    const octas = [
      'meteo.skc', // Sky Clear
      'meteo.few', // Few Clouds
      'meteo.few', // Few Clouds
      'meteo.sct', // Scattered Clouds
      'meteo.sct', // Scattered Clouds
      'meteo.bkn', // Broken Couds
      'meteo.bkn', // Broken Clouds
      'meteo.bkn', // Broken Clouds
      'meteo.ovc'  // Overcast
    ]
    return octas[Math.round(amount * 8)]
  }

 /**
  * Given a cloud type, returns a string identifier for the type in the format "meteo.<type>".
  * @param {string} type - A string representing the cloud type to identify.
  * @returns {string} - A string identifier in the format "meteo.<type>".
  */
  static _getCloudTypeId(type) {
    const [suffix] = Object.entries(CLOUD_TYPE).find(([, val]) => val === type)
    return suffix ? `meteo.${suffix}` : 'meteo.cumulunimbus'   
  }

  /**
   * Returns the humidity id that corresponds to a given humidity level.
   *
   * @param {number} humidity - The humidity level (in %).
   * @returns {string} The humidity id.
   */
  static _getHumidityId(humidity) {
    const [id] = Object.entries(HUMIDITY_LEVELS).find(([, level]) => humidity < level)
    return `meteo.${id}`
  }

  /**
   * Returns a string representing the sun intensity level based on the input amount.
   * @param {number} amount - A number between 0 and 1 representing the amount of sun.
   * @returns {string} - A string representing the sun intensity level.
   * @example
   * const intensity = _getSunAmountId(0.6); // 'meteo.normal'
  */
  static _getSunAmountId(amount) {    
    const [id] = Object.entries(SUN_INTENSITY).find(([, level]) => amount < level)
    return `meteo.${id}`
  }

  /**
   * Returns the precipitation amount id based on the amount of precipitation
   * @param {number} amount - The amount of precipitation
   * @returns {string} - The id of the precipitation amount
   * @example
   * _getPrecipitationAmountId(0.5); // 'meteo.light'
   */
  static _getPrecipitationAmountId(amount) {    
    const [id] = Object.entries(PRECI_AMOUNT).find(([, level]) => amount < level)
    return `meteo.${id}`
  }

 /**
  * Given a precipitation type, returns a string identifier for the type in the format "meteo.<type>".
  * @param {string} type - A string representing the precipitation type to identify.
  * @returns {string} - A string identifier in the format "meteo.<type>".
  */
  static _getPrecipitationTypeId(type) {
    const [suffix] = Object.entries(PRECI_TYPE).find(([, val]) => val === type)
    return suffix ? `meteo.${suffix}` : 'meteo.none'    
  }

  /**
   * Returns the wind speed identifier for a given wind object
   * @param {Object} wind - The wind object containing speed and gusts properties
   * @returns {string} - The wind speed identifier
   */
  static _getWindSpeedId(wind) {
    let gusting = wind.gusts > 5 ? 'Gusting' : ''
    const [id] = Object.entries(WIND_SPEED).find(([, level]) => wind.speed < level)
    return `meteo.${id}${gusting}`
  }

  // Return localized string of weather info
  static getPerceptiveWeatherI18n(meteoData) {
    const compiledTemplate = Handlebars.compile(Utils.i18n('meteo.perceptive'))
    const weatherInfoHtml = compiledTemplate(meteoData)
    return weatherInfoHtml
  }

  _calculateWeatherInfoFromModelData(modelData) {
    return {
      'name': modelData.name,
      'temperature': {
        'air': Math.round(modelData.temp.air),
        'ground': Math.round(modelData.temp.ground),
        'percieved': Math.round(modelData.temp.percieved),
        'percievedId': SceneWeather._getPercievedTempId(modelData.temp.percieved)
      },
      'humidity': {
        'percent': Math.round(modelData.humidity),
        'percentId': SceneWeather._getHumidityId(modelData.humidity)
      },
      'wind': {
        'speed': Math.round(modelData.wind.speed),
        'gusts': Math.round(modelData.wind.gusts),
        'speedId': SceneWeather._getWindSpeedId(modelData.wind),
        'direction': Math.round(modelData.wind.direction),
        'directionId': SceneWeather._getWindDirId(modelData.wind.direction)
      },
      'clouds': {
        'height': Math.round(modelData.clouds.bottom),
        'heightId': SceneWeather._getCloudHightId(modelData.clouds.bottom),
        'amount': Math.round(modelData.clouds.coverage * 100),
        'amountId': SceneWeather._getCloudAmountId(modelData.clouds.coverage),
        'type': SceneWeather._getCloudTypeId(modelData.clouds.type)
      },
      'sun': {
        'amount': Math.round(modelData.sun.amount * 100),
        'amountId': SceneWeather._getSunAmountId(modelData.sun.amount)
      },
      'precipitation': {
        'amount': Math.round(modelData.precipitation.amount * 100),
        'amountId': SceneWeather._getPrecipitationAmountId(modelData.precipitation.amount),
        'type': SceneWeather._getPrecipitationTypeId(modelData.precipitation.type)
      }
    }
  }

  getWeatherInfo(dayOffset = 0, hourOffset = 0) {
    return this._calculateWeatherInfoFromModelData(this.weatherModel.getWeatherData(dayOffset, hourOffset))
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

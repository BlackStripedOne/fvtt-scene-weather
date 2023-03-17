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
import { EVENTS, MODULE, GENERATOR_MODES, RAIN_MODES, PRECI_TYPE, CLOUD_TYPE, WIND_MODES } from './constants.js'
import { WeatherModel } from './weatherModel.js'
import { RegionMeteo } from './regionMeteo.js'
// import { WeatherPerception } from './weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { SceneWeatherState } from './state.js'

/**
 * This class handles weather conditions for a scene in foundry virtual tabletop.
 */
export class SceneWeather {

  sceneId = undefined
  weatherModel = undefined
  weatherMode = GENERATOR_MODES.DISABLED  // default

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
    Logger.debug('SceneWeather:ctor', { 'weatherModel': this.weatherModel, 'sceneId': this.sceneId })
  }

  /**
   * Returns a new instance of the WeatherModel class, based on the weather mode selected for the scene.
   * @param {Scene} scene - The scene object for which the weather model needs to be retrieved.
   * @returns {WeatherModel} - A new instance of the WeatherModel class, based on the weather mode selected for the scene.
   * @throws {Error} Will throw an error if the weather mode is invalid.
   */
  _getWeatherModelForMode(scene) {
    this.weatherMode = scene.getFlag(MODULE.ID, 'weatherMode') || GENERATOR_MODES.DISABLED
    Logger.debug('SceneWeather._getWeatherModelForMode(...)', { 'scene': scene, 'weatherMode': this.weatherMode, 'this': this })
    switch (this.weatherMode) {
      case GENERATOR_MODES.WEATHER_TEMPLATE:
        const weatherTemplateId = scene.getFlag(MODULE.ID, 'weatherTemplate')
        return WeatherModel.fromTemplate(weatherTemplateId)
      case GENERATOR_MODES.WEATHER_GENERATE:
        return WeatherModel.fromSceneConfig(scene._id)
      case GENERATOR_MODES.REGION_TEMPLATE:
        const regionTemplateId = scene.getFlag(MODULE.ID, 'regionTemplate')
        return WeatherModel.fromRegion(RegionMeteo.fromTemplate(regionTemplateId))
      case GENERATOR_MODES.REGION_GENERATE:
        return WeatherModel.fromRegion(new RegionMeteo()) // uses scene config of region and time provided by time provider
      case GENERATOR_MODES.DISABLED:
      case undefined:
      default:
        return undefined // throw new Error('Unable to instantiate new SceneWeather, while being disabled.')
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
    Logger.debug('SceneWeather.updateConfig()', { 'sceneId': this.sceneId, 'this': this })
    if (this.weatherModel === undefined) {
      return false
    }
    const scene = Fal.getScene(this.sceneId)
    if (scene === undefined) {
      Logger.error('Unable to instantiate SceneWeather for non existing Scene with id ' + this.sceneId)
      throw new Error('Unable to instantiate SceneWeather for non existing Scene with id ' + this.sceneId)
    }
    if (Fal.getSceneFlag('weatherMode', null, this.sceneId) != this.weatherMode) {
      // need to set new model here
      Logger.debug('SceneWeather.updateConfig() -> newMode', { 'sceneId': this.sceneId, 'prevMode': this.weatherMode, 'newMode': Fal.getSceneFlag('weatherMode', '-', this.sceneId) })

      this.weatherModel = this._getWeatherModelForMode(scene) // TODO may throw Error
      return true
    } else {
      // update existing model
      Logger.debug('SceneWeather.updateConfig() -> unchangedMode', { 'sceneId': this.sceneId })
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
    const scene = Fal.getScene(sceneId)
    if (scene === undefined) {
      Logger.error('Unable to instantiate SceneWeather for non existing Scene with id ' + sceneId)
      return undefined
    }
    //try {
    return new SceneWeather(scene)
    /*} catch (e) {
      Logger.error('SceneWeather.fromConfig(...) failed for sceneId:'+sceneId)
      return undefined
    }*/
  }

  /**
   * TODO
   */
  static _weatherModelToExternal(model, rainMode, weatherMode = GENERATOR_MODES.WEATHER_TEMPLATE) {
    const [preciType] = Object.entries(PRECI_TYPE).find(([, val]) => val === model.precipitation.type)
    const [cloudType] = Object.entries(CLOUD_TYPE).find(([, val]) => val === model.clouds.type)
    const [windType] = Object.entries(WIND_MODES).find(([, val]) => val === ((weatherMode == GENERATOR_MODES.WEATHER_GENERATE) ? model.wind.directionType : 0))
    const sourceFactor = (weatherMode == GENERATOR_MODES.WEATHER_GENERATE) ? 1 : 100
    const template = {
      "temp": {
        "ground": Math.round(model.temp.ground),
        "air": Math.round(model.temp.air)
      },
      "humidity": Math.round(model.humidity),
      "wind": {
        "speed": Math.round(model.wind.speed),
        "gusts": Math.round(model.wind.gusts),
        "directionType": windType ? windType : 'fixed',
        "direction": Math.round(model.wind.direction)
      },
      "clouds": {
        "type": cloudType ? cloudType : 'cumulunimbus',
        "coverage": Math.round(model.clouds.coverage * sourceFactor),
        "bottom": Utils.clamp(Math.round(model.clouds.bottom), 0, 20000),
        "thickness": (weatherMode == GENERATOR_MODES.WEATHER_GENERATE) ? Math.round(model.clouds.thickness) : Utils.clamp(Math.round(model.clouds.top) - Math.round(model.clouds.bottom), 0, 20000)
      },
      "precipitation": {
        "type": preciType ? preciType : 'none',
        "amount": Math.round(model.precipitation.amount * sourceFactor),
        "mode": rainMode
      },
      "sun": {
        "amount": Math.round(model.sun.amount * sourceFactor)
      }
    }
    Logger.trace('SceneWeather._weatherModelToExternal(...)', { 'model': model, 'template': template })
    return template
  }

  /**
   * TODO
   */
  getWeatherModel(dayOffset = 0, hourOffset = 0) {
    if (this.weatherModel === undefined) return undefined
    return this.weatherModel.getWeatherData(dayOffset, hourOffset)
  }

  /**
   * TODO
   */
  getWeatherSettings() {
    if (this.weatherModel === undefined) return undefined
    let settings = {
      'generator': {
        'seed': Fal.getSceneFlag('seed', '', this.sceneId),
        'mode': Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED, this.sceneId)
      }
    }
    switch (settings.generator.mode) {
      case GENERATOR_MODES.WEATHER_TEMPLATE:
        const templateData = SceneWeatherState._weatherTemplates[Fal.getSceneFlag('weatherTemplate', '', this.sceneId)]
        if (templateData !== undefined) {
          settings.weather = SceneWeather._weatherModelToExternal(templateData, Fal.getSceneFlag('rainMode', RAIN_MODES.WINDDIR, this.sceneId), settings.generator.mode)
          settings.weather.templateId = templateData.id
          settings.weather.templateName = Fal.i18n(templateData.name)
        }
        break
      case GENERATOR_MODES.WEATHER_GENERATE:
        const weatherData = Utils.deepClone(Fal.getSceneFlag('weatherSettings', {}, this.sceneId))
        settings.weather = SceneWeather._weatherModelToExternal(weatherData, Fal.getSceneFlag('rainMode', RAIN_MODES.WINDDIR, this.sceneId), settings.generator.mode)
        break
      case GENERATOR_MODES.REGION_TEMPLATE:
        settings.region = Utils.deepClone(SceneWeatherState._regionTemplates[Fal.getSceneFlag('regionTemplate', '', this.sceneId)] || {})
        settings.region.templateId = settings.region.id
        settings.region.templateName = Fal.i18n(settings.region.name)
        delete settings.region.id
        delete settings.region.name
        delete settings.region.description
        settings.weather = SceneWeather._weatherModelToExternal(this.getWeatherModel(), Fal.getSceneFlag('rainMode', RAIN_MODES.WINDDIR, this.sceneId), settings.generator.mode)
        break
      case GENERATOR_MODES.REGION_GENERATE:
        settings.region = Utils.deepClone(Fal.getSceneFlag('regionSettings', Utils.deepClone(Fal.getSetting('defaultRegionSettings')), this.sceneId))
        settings.weather = SceneWeather._weatherModelToExternal(this.getWeatherModel(), Fal.getSceneFlag('rainMode', RAIN_MODES.WINDDIR, this.sceneId), settings.generator.mode)
        break
    }
    Logger.trace('SceneWeather.getWeatherSettings()', { 'settings': settings })
    return settings
  }

  /**
   * Calculates weather information based on the weather model data and calls all registered hooks with the updated weather information.
   * @param {Object} options - Optional parameters
   * @param {boolean} options.force - A boolean value indicating whether the weather calculation should be forced
   */
  async calculateWeather({ force = false } = {}) {
    if (this.weatherModel === undefined) return
    const currentTimeHash = TimeProvider.getCurrentTimeHash()
    const modelData = this.weatherModel.getWeatherData()

    Logger.debug('SceneWeather.calculateWeather() -> WeatherUpdated', {
      'model': modelData,
      'timeHash': currentTimeHash,
      'sceneId': this.sceneId,
      'force': force  // TODO rename to 'forced'
    })

    Hooks.callAll(EVENTS.WEATHER_UPDATED, {
      'model': modelData,
      'timeHash': currentTimeHash,
      'sceneId': this.sceneId,
      'force': force  // TODO rename to 'forced'
    })
  }

}

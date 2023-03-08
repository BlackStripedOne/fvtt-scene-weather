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

import { Logger } from './utils.js'
import { TimeProvider } from './timeProvider.js'
import { MODULE, GENERATOR_MODES } from './constants.js'
import { WeatherModel } from './weatherModel.js'
import { RegionMeteo } from './regionMeteo.js'
import { WeatherPerception } from './weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
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
    this.weatherMode = scene.getFlag(MODULE.ID, 'weatherMode') || GENERATOR_MODES.DISABLED
    Logger.debug('SceneWeather._getWeatherModelForMode(...)', { 'scene': scene, 'weatherMode': this.weatherMode })
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
    const scene = Fal.getScene(this.sceneId)
    if (scene === undefined) {
      Logger.error('Unable to instantiate SceneWeather for non existing Scene with id ' + this.sceneId)
      throw new Error('Unable to instantiate SceneWeather for non existing Scene with id ' + this.sceneId)
    }
    if (Fal.getSceneFlag('weatherMode', null, this.sceneId) != this.weatherMode) {
      // need to set new model here
      Logger.debug('SceneWeather.updateConfig() -> new mode', { 'sceneId': this.sceneId, 'prevMode': this.weatherMode, 'newMode': Fal.getSceneFlag('weatherMode', '-', this.sceneId) })

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
    const scene = Fal.getScene(sceneId)
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

    // TODO get via perception model configured for user settings
    const perceptionId = 'perceptive'
    const weatherInfo = WeatherPerception.getAsWeatherInfo(perceptionId, modelData)

    Logger.debug('SceneWeather.calculateWeather() -> WeatherUpdated', {
      'info': weatherInfo, // TODO may not be required. Use Perciever instead
      'model': modelData,
      'timeHash': currentTimeHash,
      'sceneId': this.sceneId,
      'force': force  // TODO rename to 'forced'
    })

    Hooks.callAll(MODULE.LCCNAME + 'WeatherUpdated', {
      'info': weatherInfo, // TODO may not be required. Use Perciever instead
      'model': modelData,
      'timeHash': currentTimeHash,
      'sceneId': this.sceneId,
      'force': force  // TODO rename to 'forced'
    })
  }

}

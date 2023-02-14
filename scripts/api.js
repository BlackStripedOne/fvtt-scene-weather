import { Logger, Utils } from './utils.js'
import { MODULE } from './constants.js'
import { SceneWeather } from './sceneWeather.js'
import { WeatherModel } from './weatherModel.js'
import { RegionMeteo } from './regionMeteo.js'
import { WeatherUi } from './weatherUi.js'
import { TimeProvider } from './timeProvider.js'

/**
 * Scene Weather's public API functions, attached to the foundry game object.
 */
export class SceneWeatherApi {

  static _lastUpdate = 0
  static _sceneWeather = {}

  /**
   * Initialize the application
   */
  static async registerApi() {

    // If no application instance exists, create a new instance of SceneWeather and initialize it
    if (!game.sceneWeather) {
      game.sceneWeather = {}
      game.sceneWeather.get = SceneWeatherApi.getSceneWeatherProvider
      game.sceneWeather.updateSettings = SceneWeatherApi.updateSettings
      game.sceneWeather.updateWeather = SceneWeatherApi.updateWeather

      /* TODO init pattern:
      game.sceneWeather.app.SceneWeather = new SceneWeather()
      await game.sceneWeather.app.SceneWeather.init()
      */
      Logger.debug('sceneWeather API registered as game.sceneWeather')
    } else {
      Logger.debug('SceneWeather API aleady registered!');
    }
  }

  /**
   * Update Scene Weather following change to module settings
   */
  static async updateSettings() {
    // TODO ? game.sceneWeather.app.SceneWeather?.updateSettings()
  }

  // TODO Api Functions go here

  /**
   * TODO
   */
  static updateWeather(forSceneId = undefined, force = false) {
    Logger.debug('API:updateWeather')
    if (force) {
      SceneWeatherApi._lastUpdate = -1
      SceneWeatherApi.getSceneWeatherProvider(forSceneId, true).update() // Update from configs
    }
    let currentTimeHash = TimeProvider.getTimeHash()
    if (SceneWeatherApi._lastUpdate === currentTimeHash) return
    SceneWeatherApi._lastUpdate = currentTimeHash
    WeatherUi.update()
  }

  /**
   * Returns the SceneWeather for the currently active scene
   */
  static getSceneWeatherProvider(forSceneId = undefined, ignoreCache = false) {
    let sceneId = canvas.scene._id
    if (forSceneId !== undefined) {
      sceneId = forSceneId
    }
    if (ignoreCache) {
      SceneWeatherApi._sceneWeather[sceneId] = undefined
    }
    if (SceneWeatherApi._sceneWeather[sceneId] !== undefined) {
      Logger.debug('api, found in cache', { 'sceneId': sceneId, 'sceneWeather': SceneWeatherApi._sceneWeather[sceneId] })
      return SceneWeatherApi._sceneWeather[sceneId]
    }
    let weatherMode = canvas.scene.getFlag(MODULE.ID, 'weatherMode')
    // TODO check when weatherMode is undefined, use 'disabled'
    switch (weatherMode) {
      case 'weatherTemplate':
        // Weather Template (Rainstorm, Thunder, Sunny Breeze, ...) / Time,Date agnostic
        let weatherTemplateId = canvas.scene.getFlag(MODULE.ID, 'weatherTemplate')
        Logger.debug('getSceneWeatherProvider:weatherTemplate', { 'weatherTemplate': weatherTemplateId, 'sceneId': sceneId, 'noCache': ignoreCache })
        SceneWeatherApi._sceneWeather[sceneId] = new SceneWeather(WeatherModel.fromTemplate(weatherTemplateId))
        break
      case 'regionTemplate':
        // Region Template (Boreal Forest, Shorelines, Mountains, ...) Time,Date aware
        let regionTemplateId = canvas.scene.getFlag(MODULE.ID, 'regionTemplate')
        Logger.debug('getSceneWeatherProvider:regionTemplate', { 'regionTemplate': regionTemplateId, 'sceneId': sceneId, 'noCache': ignoreCache })
        SceneWeatherApi._sceneWeather[sceneId] = new SceneWeather(WeatherModel.fromRegion(RegionMeteo.fromTemplate(regionTemplateId)))
        break
      case 'regionAuto':
        // Region Automatic (Temps, Moists, Winds, ...) Time,Date dependant
        SceneWeatherApi._sceneWeather[sceneId] = new SceneWeather(WeatherModel.fromRegion(new RegionMeteo())) // uses scene config of region and time provided by time provider		
        break
      case 'disabled':
      default:
        Logger.debug('getSceneWeatherProvider:disabled')
        SceneWeatherApi._sceneWeather[sceneId] = undefined
        break
    }
    return SceneWeatherApi._sceneWeather[sceneId]
  }

}   // SceneWeatherApi

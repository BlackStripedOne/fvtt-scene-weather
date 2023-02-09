import { Logger, Utils } from './utils.js'
import { MODULE } from './constants.js'
import { SceneWeather } from './sceneWeather.js'
import { WeatherModel } from './weatherModel.js'
import { RegionMeteo } from './regionMeteo.js'

/**
 * Scene Weather's public API functions, attached to the foundry game object.
 */
export class SceneWeatherApi {

  /**
   * Initialize the application
   */
  static async registerApi() {

    // If no application instance exists, create a new instance of SceneWeather and initialize it
    if (!game.sceneWeather) {
      game.sceneWeather = {}
      game.sceneWeather.get = SceneWeatherApi.getSceneWeatherProvider
      game.sceneWeather.updateSettings = SceneWeatherApi.updateSettings

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

  // Returns the SceneWeather for the currently active scene
  static getSceneWeatherProvider() {
    let weatherMode = canvas.scene.getFlag(MODULE.ID, 'weatherMode')
    // TODO check when weatherMode is undefined, use 'disabled'
    switch (weatherMode) {
      case 'weatherTemplate':
        // Weather Template (Rainstorm, Thunder, Sunny Breeze, ...) / Time,Date agnostic
        let weatherTemplateId = canvas.scene.getFlag(MODULE.ID, 'weatherTemplate')
        Logger.debug('getSceneWeatherProvider:weatherTemplate', { 'weatherTemplate': weatherTemplateId })
        return new SceneWeather(WeatherModel.fromTemplate(weatherTemplateId))
      case 'regionTemplate':
        // Region Template (Boreal Forest, Shorelines, Mountains, ...) Time,Date aware          
        let regionTemplateId = canvas.scene.getFlag(MODULE.ID, 'regionTemplate')
        Logger.debug('getSceneWeatherProvider:regionTemplate', { 'regionTemplate': regionTemplateId })
        return new SceneWeather(WeatherModel.fromRegion(RegionMeteo.fromTemplate(regionTemplateId)))
      case 'regionAuto':
        // Region Automatic (Temps, Moists, Winds, ...) Time,Date dependant
        return new SceneWeather(WeatherModel.fromRegion(new RegionMeteo())) // uses scene config of region and time provided by time provider		
      case 'disabled':
      default:
        Logger.debug('getSceneWeatherProvider:disabled')
        return null
    }
  }

}   // SceneWeatherApi

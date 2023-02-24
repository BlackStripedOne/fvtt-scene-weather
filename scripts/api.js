import { Logger, Utils } from './utils.js'
import { SceneWeather } from './sceneWeather.js'
import { TimeProvider } from './timeProvider.js'

/**
 * Scene Weather's public API functions, attached to the foundry game object.
 */
export class SceneWeatherApi {

  static _lastUpdate = 0  // last update in timeHash
  static _sceneWeather = {}  // cached instances of sceneWeather by scene ID

  /**
   * Initialize the application
   */
  static async registerApi() {

    // If no application instance exists, create a new instance of SceneWeather and initialize it
    if (!game.sceneWeather) {
      game.sceneWeather = {}
      game.sceneWeather.get = SceneWeatherApi.getSceneWeatherProvider // TODO remove api access to provider

      game.sceneWeather.updateSettings = SceneWeatherApi.updateSettings

      // Update configuration for the weather configuration models, essentially invalidating caches
      game.sceneWeather.updateWeatherConfig = SceneWeatherApi.updateWeatherConfig

      // Calculates the weather for the current game time and current scene and sends an event
      game.sceneWeather.calculateWeather = SceneWeatherApi.calculateWeather

      // all registered generators
      game.sceneWeather.generators = []

      // all registered filters
      game.sceneWeather.filters = []

      // all region templates
      game.sceneWeather.regionTemplates = []

      // all static weather templates
      game.sceneWeather.weatherTemplates = []

      Logger.debug('sceneWeather API registered as game.sceneWeather')
    } else {
      Logger.debug('SceneWeather API aleady registered!');
    }
  }

  /**
   * Update Scene Weather following change to module settings
   */
  static async updateSettings() {
    Logger.debug('api::updateSettings')
    // TODO ? game.sceneWeather.app.SceneWeather?.updateSettings()
  }

  // TODO Api Functions go here


  /**
   * Calculate the current weather for the current time and scene displayed based on the
   * configuration set by the scene's flags. Upon new weather information or changed
   * weather the event 'WeatherUpdated' is emitted with additional data attached.
   * 
   * force -> true: will always calculate the weather anew, wether it was calculated
   * already or not and emit the event.
   */
  static calculateWeather({ force = false, sceneId = undefined } = {}) {
    Logger.debug('api::calculateWeather(...)', { 'sceneId': sceneId, 'force': force })
    if (sceneId === undefined) sceneId = canvas.scene._id

    if (sceneId != canvas.scene._id) {
      Logger.debug('Not calculating weather for non current scene...')
      return
    }

    if (force) {
      SceneWeatherApi._lastUpdate = -1
    }

    let currentTimeHash = TimeProvider.getCurrentTimeHash()
    if (SceneWeatherApi._lastUpdate == currentTimeHash) return
    SceneWeatherApi._lastUpdate = currentTimeHash

    const provider = SceneWeatherApi.getSceneWeatherProvider(sceneId)
    provider.calculateWeather({
      'force': force
    })
  }

  /**
   * Update the weather provider's configuration and internal precalculations as well as
   * invalidating the internal caches of the cascading weather modesla and region providers
   * if applicable.
   * 
   */
  static updateWeatherConfig({ forSceneId = undefined, force = false, prewarm = false, fade = true } = {}) {
    Logger.debug('api::updateWeatherConfig(...)', { 'forSceneId': forSceneId, 'force': force })
    // Update from configs
    if (SceneWeatherApi.getSceneWeatherProvider(forSceneId, force).updateConfig() || force) {
      SceneWeatherApi.calculateWeather({
        sceneId: forSceneId,
        force: true
      })
    }
  }

  /**
   * Returns the SceneWeather for the currently active scene
   */
  static getSceneWeatherProvider(forSceneId = undefined, ignoreCache = false) {
    let sceneId = canvas.scene._id
    if (forSceneId !== undefined) {
      sceneId = forSceneId
    }

    Logger.debug('api::getSceneWeatherProvider()', { 'forSceneId': forSceneId, 'sceneId': sceneId, 'ignoreCache': ignoreCache })

    if (ignoreCache) {
      SceneWeatherApi._sceneWeather[sceneId] = undefined
    }
    if (SceneWeatherApi._sceneWeather[sceneId] !== undefined) {
      return SceneWeatherApi._sceneWeather[sceneId]
    }

    SceneWeatherApi._sceneWeather[sceneId] = SceneWeather.fromConfig({
      'sceneId': sceneId
    })  // May also be undefined

    return SceneWeatherApi._sceneWeather[sceneId]
  }

}   // SceneWeatherApi

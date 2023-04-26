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
import { WeatherPerception } from './weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { SceneWeatherState } from './state.js'
import { MacroConfigDialog } from './macros/macroConfig.js'
import { GENERATOR_MODES, CLOUD_TYPE, PRECI_TYPE, WIND_MODES } from './constants.js'
import { Permissions } from './permissions.js'
import { TokenAmbience } from './tokens/ambience.js'

// will be available globally via SceneWeather.
export function getSceneWeatherAPIv1() {

  const DEFAULT_REGION_STRUCT = {
    'id': 'unknown',
    'name': 'unknown',
    'description': 'unknown',
    'elevation': 0,
    'vegetation': 0,
    'waterAmount': 0,
    'summer': {
      'temperature': {
        'day': 0,
        "night": 0,
        "var": 0
      },
      'humidity': {
        'day': 0,
        'night': 0,
        'var': 0
      },
      'wind': {
        'avg': 0,
        'var': 0
      },
      'sun': {
        'hours': 0
      }
    },
    'winter': {
      'temperature': {
        'day': 0,
        "night": 0,
        "var": 0
      },
      'humidity': {
        'day': 0,
        'night': 0,
        'var': 0
      },
      'wind': {
        'avg': 0,
        'var': 0
      },
      'sun': {
        'hours': 0
      }
    }
  }

  const DEFAULT_WEATHER_STRUCT = {
    'id': 'unknown',
    'name': 'unknown',
    'temp': {
      'underground': 14.5,
      'ground': 0,
      'air': 0,
      'percieved': 0
    },
    'wind': {
      'speed': 0,
      'gusts': 0,
      'direction': 0
    },
    'clouds': {
      'coverage': 0,
      'bottom': 0,
      'top': 0,
      'type': 0
    },
    'precipitation': {
      'amount': 0,
      'type': 0
    },
    'sun': {
      'amount': 0,
    },
    'humidity': 0
  }

  const DEFAULT_CYCLE_TIME_STRUCT = {
    'daylightCycle': -50.00,
    'seasonCycle': -50.00
  }

  /**
   * Clears the current scene by unsetting various scene flags, as long as the user has the required permissions.
   * 
   * @async
   * @returns {Promise<Array>} - A promise that resolves with an array of promises that unset various scene flags.
   * @throws {Error} If the user does not have the required permissions to clear the scene.
   */
  async function clearScene() {
    Logger.debug('clearScene')
    if (!Permissions.hasPermission(Fal.userID(), 'sceneSettings')) {
      Logger.error('clearScene | ' + Fal.i18n('api.noPermission'))
      return
    }
    if (!canvas.ready || !canvas.scene) return
    await Fal.setSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)
    return Promise.all([
      Fal.unsetSceneFlag('weatherMode'),
      Fal.unsetSceneFlag('rainMode'),
      Fal.unsetSceneFlag('regionTemplate'),
      Fal.unsetSceneFlag('seed'),
      Fal.unsetSceneFlag('timeProvider'),
      Fal.unsetSceneFlag('weatherTemplate'),
      Fal.unsetSceneFlag('weatherSettings'),
      Fal.unsetSceneFlag('regionSettings'),
      Fal.unsetSceneFlag('nodes')
    ])
  }

  /**
   * Update the configuration of the weather provider and invalidate the internal caches of the
   * cascading weather models and region providers if applicable.
   * 
   * @async
   * @param {Object} [options={}] - Optional parameters object.
   * @param {string} [options.forSceneId=undefined] - The scene ID for which to update the weather configuration.
   * @param {boolean} [options.force=false] - Indicates whether the update should be forced, bypassing any internal caching mechanisms.
   * @throws {Error} - If an error occurs while updating the configuration.
   * @returns {Promise<void>} - A promise that resolves once the configuration has been successfully updated.
   * 
   * @example
   * // Update the weather configuration for a specific scene, forcing a refresh of the internal caches
   * await SceneWeather.updateWeatherConfig({ forSceneId: 'myScene', force: true });
   */
  async function updateWeatherConfig({ forSceneId = undefined, force = false } = {}) {
    Logger.debug('updateWeatherConfig', { 'forSceneId': forSceneId, 'force': force })
    // Update from configs
    const weatherProvider = SceneWeatherState.getSceneWeatherProvider(forSceneId, force)
    if (weatherProvider !== undefined) {
      if (weatherProvider.updateConfig() || force) {
        updateWeather({
          sceneId: forSceneId,
          force: true
        })
      }
    }
  }

  /**
   * Asynchronously calculates and updates the current weather conditions for the scene based on the configuration set by the scene's flags.
   * 
   * @param {object} options - Optional object containing options for the function.
   * @param {boolean} [options.force=false] - If true, will calculate the weather anew regardless of whether it has already been calculated or not.
   * @param {string} [options.sceneId=undefined] - The ID of the scene for which to update the weather. If not specified, will default to the current scene.
   * @returns {Promise<void>} - A Promise that resolves when the weather has been updated.
   * @fires WeatherUpdated - Emitted when new weather information is available or when the weather configuration has changed. Additional data is attached to the event.
   * @throws {Error} - If the specified scene ID does not exist.
   * 
   * @example
   * // Update weather for the current scene without forcing recalculation
   * await SceneWeather.updateWeather();
   * @example
   * // Update weather for a specific scene and force recalculation
   * await SceneWeather.updateWeather({ force: true, sceneId: "abc123" });
   */
  async function updateWeather({ force = false, sceneId = undefined } = {}) {
    Logger.debug('updateWeather(...)', { 'sceneId': sceneId, 'force': force, 'canvasSceneId': canvas.scene._id })
    if (sceneId === undefined) sceneId = canvas.scene._id
    if (sceneId != canvas.scene._id) return
    if (force) {
      SceneWeatherState._lastUpdate = -1
    }
    const currentTimeHash = TimeProvider.getCurrentTimeHash()
    if (SceneWeatherState._lastUpdate == currentTimeHash) return
    SceneWeatherState._lastUpdate = currentTimeHash
    const provider = SceneWeatherState.getSceneWeatherProvider(sceneId)
    if (provider !== undefined) {
      provider.calculateWeather({
        'force': force
      })
    }
  }

  /**
   * This function registers a region template with the SceneWeatherState module. The region template is identified by
   * the moduleId and templateId parameters, and its data is defined by the regionData parameter. If the moduleId, templateId,
   * and regionData are all provided, and the module identified by the moduleId parameter is enabled, then the region
   * template is registered with the SceneWeatherState module. If any of the required parameters are missing or the module
   * identified by the moduleId parameter is not enabled, then an error is logged and the region template is not registered.
   * 
   * @param {string} moduleId - The moduleId of the module that the region template belongs to.
   * @param {string} templateId - The templateId of the region template.
   * @param {object} regionData - The region data that defines the region template.
   * @throws {Error} If the module ID or template ID is missing, or if the module is not enabled.
   */
  function registerRegionTemplate(moduleId = null, templateId = null, regionData = {}) {
    if (moduleId && templateId && regionData && Fal.isModuleEnabled(moduleId)) {
      // TODO use option inplace:false instead of deepClone ?
      regionData.id = moduleId + '.' + templateId
      const regionDataSafe = Utils.mergeObject(Utils.deepClone(DEFAULT_REGION_STRUCT), regionData, { insertKeys: false, enforceTypes: true })
      SceneWeatherState._regionTemplates[regionDataSafe.id] = regionDataSafe
      Logger.info('registerRegionTemplate | ' + Fal.i18n('api.regRegionTemplate') + moduleId + '.' + templateId)
    } else {
      Logger.error('registerRegionTemplate | ' + Fal.i18n('api.regRegionTemplateFail') + moduleId + '.' + templateId, true)
    }
  }

  /**
   * Registers a weather template for a given module and template id.
   * 
   * @param {string} moduleId - The ID of the module to register the weather template for.
   * @param {string} templateId - The ID of the template to register.
   * @param {Object} weatherData - The data to use for the weather template.
   * @throws {Error} If the module ID or template ID is missing, or if the module is not enabled.
   */
  function registerWeatherTemplate(moduleId = null, templateId = null, weatherData = {}) {
    if (moduleId && templateId && weatherData && Fal.isModuleEnabled(moduleId)) {
      weatherData.id = moduleId + '.' + templateId
      const weatherDataSafe = Utils.mergeObject(Utils.deepClone(DEFAULT_WEATHER_STRUCT), weatherData, { insertKeys: false, enforceTypes: true })
      SceneWeatherState._weatherTemplates[moduleId + '.' + templateId] = weatherDataSafe
      Logger.info('registerWeatherTemplate | ' + Fal.i18n('api.regWeatherTemplate') + moduleId + '.' + templateId)
    } else {
      Logger.error('registerWeatherTemplate | ' + Fal.i18n('api.regWeatherTemplateFail') + moduleId + '.' + templateId, true)
    }
  }

  /**
   * Registers a weather effects generator function to be used by SceneWeatherState.
   * This function registers a weather effects generator function to be used by SceneWeatherState.
   * The generator function is identified by its ID (generatorId) and is passed as a parameter to getEmitterFunction.
   * The generator function must be a function that returns an emitter object that is used to create weather effects.
   * 
   * @param {string} generatorId - The ID of the weather effects generator function. 
   * @param {function} getEmitterFunction - The function that generates the weather effects.
   * @throws {TypeError} - If generatorId or getEmitterFunction parameters are not provided or are not of type string or function, respectively. 
   */
  function registerWeatherFxGenerator(generatorId = null, getEmitterFunction = null) {
    Logger.info('registerWeatherFxGenerator | ' + Fal.i18n('api.regFxGenerator') + generatorId)
    SceneWeatherState._generators.push({
      'name': generatorId,
      'getEmitter': getEmitterFunction
    })
  }

  /**
   * This function adds a new weather effect filter to the list of filters in the SceneWeatherState object.
   * The filter is represented by an object with a name property and a getFilterConfig property.
   * The name property is a string that identifies the filter, and the getFilterConfig property is a function
   * that returns an object with configuration data for the filter.
   * If no filterId or getFilterConfigFunction is provided, the function does nothing and returns undefined.
   *
   * @param {string} filterId - The identifier of the new filter.
   * @param {function} getFilterConfigFunction - A function that returns the configuration object for the filter.
   */
  function registerWeatherFxFilter(filterId = null, getFilterConfigFunction = null) {
    Logger.info('registerWeatherFxFilter | ' + Fal.i18n('api.regFxFilter') + filterId)
    SceneWeatherState._filters.push({
      'name': filterId,
      'getFilterConfig': getFilterConfigFunction
    })
  }

  /**
   * Retrieves the weather model from the scene's weather provider with the given day and hour offsets.
   * 
   * @param {number} [dayOffset=0] - The day offset from the current day for which to retrieve the weather model.
   * @param number} [hourOffset=0] - The hour offset from the current hour for which to retrieve the weather model. 
   * @returns {object} The weather model object for the specified day and hour offsets, or undefined if the scene has no weather provider.
   */
  function getWeatherModel(dayOffset = 0, hourOffset = 0) {
    Logger.debug('getWeatherModel(...)', { 'dayOffset': dayOffset, 'hourOffset': hourOffset })
    const weatherProvider = SceneWeatherState.getSceneWeatherProvider()
    if (weatherProvider !== undefined) {
      return weatherProvider.getWeatherModel(dayOffset, hourOffset)
    }
  }

  /**
   * Returns the weather settings for the scene from the weather provider.
   * 
   * @returns - The weather settings object, or undefined if the weather provider is not available. TODO Struct
   */
  function getWeatherSettings() {
    Logger.debug('getWeatherSettings()')
    const weatherProvider = SceneWeatherState.getSceneWeatherProvider()
    if (weatherProvider !== undefined) {
      return weatherProvider.getWeatherSettings()
    }
  }

  /**
   * TODO
   */
  function getTokenAmbience(token) {
    if (!token || (!token instanceof Token)) return undefined
    if (!token || !canvas || !canvas.ready) return undefined
    if (!Fal.getControlledTokens().includes(token)) {
      Logger.warn('getTokenAmbience | No permission to get for non controlled tokens.')
      return undefined
    }
    // no SceneWeather enabled, no ambience
    const weatherProvider = SceneWeatherState.getSceneWeatherProvider()
    if (!weatherProvider) return undefined
    return TokenAmbience.getAmbienceForPosition(token.center || { x: -1, y: -1 }, weatherProvider)
  }

  /**
   * This function sets the seed for the current scene. It first checks if the user has permission to
   * modify scene settings. If they do not, an error is logged and the function returns. If the
   * canvas is not yet ready or if there is no current scene, the function also returns without
   * doing anything. Otherwise, it sets the scene flag for the seed to the provided string, and
   * refreshes the macro configuration dialog to reflect the changes.
   * 
   * @param {string} [seedString=''] - The seed string to set. Defaults to an empty string. 
   * @returns {Promise<void>} - A promise that resolves once the seed has been set.
   * @throws {Error} - If the user does not have permission to modify scene settings.
   */
  async function setSeed(seedString = '') {
    Logger.debug('setSeed(...)', { 'seedString': seedString })
    if (!Permissions.hasPermission(Fal.userID(), 'sceneSettings')) {
      Logger.error('setSeed | ' + Fal.i18n('api.noPermission'))
      return
    }
    if (!canvas.ready || !canvas.scene) return
    await Fal.setSceneFlag('seed', seedString)
    // redraw changes to macro config dialog
    MacroConfigDialog.refresh()
  }

  /**
   * Sets the cycle times for the day of year and time of day, using the provided cycleTimes object.
   * 
   * @param {number} 0.00 <= cycleTimes.daylightCycle <= 100.00 - This represents the percentage in the daylight cycle. 0.00 is midnight, start of the day, 50.00 is noon in the middle of the day.
   * @param {number} 0.00 <= cycleTimes.seasonCycle <= 100.00 - This represents the percentage in the year's season cycle. 0.00 is the winter solstice, 50.00 is the summer solstice day in the year.
   * @returns {Promise<void>} A Promise that resolves when the cycle times have been successfully set, or rejects with an error if the user doesn't have the required permissions or there's no time authority.
   * @throws {Error} An error is thrown if the user doesn't have the required permissions or there's no time authority.
   */
  async function setCycleTimes(cycleTimes) {
    Logger.debug('setCycleTimes(...)', { 'cycleTimes': cycleTimes })
    if (!Permissions.hasPermission(Fal.userID(), 'timeControls')) {
      Logger.error('setCycleTimes | ' + Fal.i18n('api.noPermission'))
      return
    }
    if (!TimeProvider.hasTimeAuthority()) {
      Logger.error('setCycleTimes | ' + Fal.i18n('api.noTimeAuthority'))
      return
    }
    const safeCycleTimes = Utils.mergeObject(Utils.deepClone(DEFAULT_CYCLE_TIME_STRUCT), cycleTimes, { insertKeys: false })
    // day of year
    if (safeCycleTimes.seasonCycle >= 0.00) {
      const seasonCycle = Utils.clamp(safeCycleTimes.seasonCycle, 0.00, 100.00)
      await TimeProvider.setSeasonCyclePct(seasonCycle / 100)
    }

    // time of day    
    if (safeCycleTimes.daylightCycle >= 0.00) {
      const daylightCycle = Utils.clamp(safeCycleTimes.daylightCycle, 0.00, 100.00)
      await TimeProvider.setDaylightCyclePct(daylightCycle / 100)
    }
  }

  /**
   * Set the weather settings for the current scene.
   * 
   * @param {Object} weatherSettings - An object containing the weather settings for the current scene.
   * @param {Object} weatherSettings.temp - An object containing the temperature settings.
   * @param {number} weatherSettings.temp.ground - The temperature at ground level.
   * @param {number} weatherSettings.temp.air - The temperature at air level.
   * @param {number} weatherSettings.humidity - The humidity level.
   * @param {Object} weatherSettings.wind - An object containing the wind settings.
   * @param {number} weatherSettings.wind.speed - The speed of the wind.
   * @param {number} weatherSettings.wind.gusts - The speed of the gusts.
   * @param {string} weatherSettings.wind.directionType - The type of wind direction.
   * @param {number} weatherSettings.wind.direction - The direction of the wind.
   * @param {Object} weatherSettings.clouds - An object containing the cloud settings.
   * @param {string} weatherSettings.clouds.type - The type of clouds.
   * @param {number} weatherSettings.clouds.coverage - The coverage of the clouds.
   * @param {number} weatherSettings.clouds.bottom - The height of the bottom of the clouds.
   * @param {number} weatherSettings.clouds.thickness - The thickness of the clouds.
   * @param {Object} weatherSettings.precipitation - An object containing the precipitation settings.
   * @param {string} weatherSettings.precipitation.type - The type of precipitation.
   * @param {number} weatherSettings.precipitation.amount - The amount of precipitation.
   * @param {Object} weatherSettings.sun - An object containing the sun settings.
   * @param {number} weatherSettings.sun.amount - The amount of sun.
   * @returns {Promise<void>}
   * @throws {Error} If the user does not have permission to change scene settings or if an error occurs while updating the weather settings.
   */
  async function setWeather(weatherSettings) {
    Logger.debug('setWeather(...)', { 'weatherSettings': weatherSettings })
    if (!Permissions.hasPermission(Fal.userID(), 'sceneSettings')) {
      Logger.error('setWeather | ' + Fal.i18n('api.noPermission'))
      return
    }

    try {
      const safeWeatherData = {
        "temp": {
          "ground": _checkParam(weatherSettings, 'temp.ground', 'number', (v) => { return Math.round(Utils.clamp(v, -30, 50)) }),
          "air": _checkParam(weatherSettings, 'temp.air', 'number', (v) => { return Math.round(Utils.clamp(v, -30, 50)) }),
        },
        "humidity": _checkParam(weatherSettings, 'humidity', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
        "wind": {
          "speed": _checkParam(weatherSettings, 'wind.speed', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 130)) }),
          "gusts": _checkParam(weatherSettings, 'wind.gusts', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 130)) }),
          "directionType": _checkParam(weatherSettings, 'wind.directionType', 'string', (v) => { return WIND_MODES[v] || WIND_MODES.fixed }),
          "direction": _checkParam(weatherSettings, 'wind.direction', 'number', (v) => { return Math.round(v) % 360 })
        },
        "clouds": {
          "type": _checkParam(weatherSettings, 'clouds.type', 'string', (v) => { return CLOUD_TYPE[v] || CLOUD_TYPE.none }),
          "coverage": _checkParam(weatherSettings, 'clouds.coverage', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
          "bottom": _checkParam(weatherSettings, 'clouds.bottom', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 20000)) }),
          "thickness": _checkParam(weatherSettings, 'clouds.thickness', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 20000)) })
        },
        "precipitation": {
          "type": _checkParam(weatherSettings, 'precipitation.type', 'string', (v) => { return PRECI_TYPE[v] || PRECI_TYPE.none }),
          "amount": _checkParam(weatherSettings, 'precipitation.amount', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) })
        },
        "sun": {
          "amount": _checkParam(weatherSettings, 'sun.amount', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) })
        }
      }
      Logger.trace('setWeather(...)', { 'safeWeatherData': safeWeatherData })

      await Fal.setSceneFlag('weatherSettings', safeWeatherData)
      Logger.info('setWeather | ' + Fal.i18n('api.updateWeather'))

      const currentWeatherMode = Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)
      if (currentWeatherMode != GENERATOR_MODES.WEATHER_GENERATE) {
        await Fal.setSceneFlag('weatherMode', GENERATOR_MODES.WEATHER_GENERATE)
        Logger.info('setWeather | ' + Fal.i18n('api.updateWeatherMode') + GENERATOR_MODES.WEATHER_GENERATE)
      }
    } catch (error) {
      Logger.error('setWeather | ' + Fal.i18n('api.updateRegionFail') + error.message, true)
    }
  }

  /**
   * Sets the weather template for the current scene.
   *
   * @param {string} [templateId=''] - The id of the weather template to set.
   * @throws {Error} Throws an error if the user does not have permission to modify scene settings, the provided template id is in an invalid format, the module containing the template is inactive, or the provided template id does not exist.
   * @returns {Promise<void>} Returns a Promise that resolves when the weather template and mode have been updated.
   *
   * @example
   * // Set the weather template to 'scene-weather.thunderstorm'
   * await SceneWeather.setWeatherTemplate('scene-weather.thunderstorm');
   */
  async function setWeatherTemplate(templateId = '') {
    Logger.debug('setWeatherTemplate(...)', { 'templateId': templateId })
    if (!Permissions.hasPermission(Fal.userID(), 'sceneSettings')) {
      Logger.error('setWeatherTemplate | ' + Fal.i18n('api.noPermission'))
      return
    }
    // test if weather with that template id exists
    if (!templateId.includes('.')) {
      Logger.error('setWeatherTemplate | ' + Fal.i18n('api.setTemplate.idFormatInvalid'))
      return
    }
    const [moduleId, templateInnerId] = templateId.split('.')
    if (!Fal.isModuleActive(moduleId)) {
      Logger.error('setWeatherTemplate | ' + Fal.i18n('api.setTemplate.moduleInactive') + moduleId)
      return
    }
    if (!Object.keys(SceneWeatherState._weatherTemplates).includes(templateId)) {
      Logger.error('setWeatherTemplate | ' + Fal.i18n('api.setTemplate.noSuchTemplate') + templateId)
      return
    }
    const weatherTemplate = SceneWeatherState._weatherTemplates[templateId]
    const currentTemplateId = Fal.getSceneFlag('weatherTemplate', null)
    if (currentTemplateId != templateId) {
      await Fal.setSceneFlag('weatherTemplate', templateId)
      Logger.info('setWeatherTemplate | ' + Fal.i18n('api.setTemplate.updateWeatherTemplate') + Fal.i18n(weatherTemplate.name) + ' (' + templateId + ')')
    }
    const currentWeatherMode = Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)
    if (currentWeatherMode != GENERATOR_MODES.WEATHER_TEMPLATE) {
      await Fal.setSceneFlag('weatherMode', GENERATOR_MODES.WEATHER_TEMPLATE)
      Logger.info('setWeatherTemplate | ' + Fal.i18n('api.updateWeatherMode') + GENERATOR_MODES.WEATHER_TEMPLATE)
    }
  }

  /**
   * Set the region settings for the current scene.
   *
   * @param {Object} regionSettings - The region settings to set for the scene.
   * @param {number} regionSettings.elevation - The elevation value to set for the scene (between 0 and 10000).
   * @param {number} regionSettings.vegetation - The vegetation value to set for the scene (between 0 and 100).
   * @param {number} regionSettings.waterAmount - The water amount value to set for the scene (between 0 and 100).
   * @param {Object} regionSettings.summer - The summer settings to set for the scene.
   * @param {Object} regionSettings.summer.temperature - The summer temperature settings to set for the scene.
   * @param {number} regionSettings.summer.temperature.day - The day temperature value to set for the summer (between -30 and 50).
   * @param {number} regionSettings.summer.temperature.night - The night temperature value to set for the summer (between -30 and 50).
   * @param {number} regionSettings.summer.temperature.var - The temperature variation value to set for the summer (between 0 and 20).
   * @param {Object} regionSettings.summer.humidity - The summer humidity settings to set for the scene.
   * @param {number} regionSettings.summer.humidity.day - The day humidity value to set for the summer (between 0 and 100).
   * @param {number} regionSettings.summer.humidity.night - The night humidity value to set for the summer (between 0 and 100).
   * @param {number} regionSettings.summer.humidity.var - The humidity variation value to set for the summer (between 0 and 50).
   * @param {Object} regionSettings.summer.wind - The summer wind settings to set for the scene.
   * @param {number} regionSettings.summer.wind.avg - The average wind value to set for the summer (between 0 and 70).
   * @param {number} regionSettings.summer.wind.var - The wind variation value to set for the summer (between 0 and 50).
   * @param {Object} regionSettings.summer.sun - The summer sun settings to set for the scene.
   * @param {number} regionSettings.summer.sun.hours - The sun hours value to set for the summer (between 1 and 23).
   * @param {Object} regionSettings.winter - The winter settings to set for the scene.
   * @param {Object} regionSettings.winter.temperature - The winter temperature settings to set for the scene.
   * @param {number} regionSettings.winter.temperature.day - The day temperature value to set for the winter (between -30 and 50).
   * @param {number} regionSettings.winter.temperature.night - The night temperature value to set for the winter (between -30 and 50).
   * @param {number} regionSettings.winter.temperature.var - The temperature variation value to set for the winter (between 0 and 20).
   * @param {Object} regionSettings.winter.humidity - The winter humidity settings to set for the scene.
   * @param {number} regionSettings.winter.humidity.day - The day humidity value to set for the winter (between 0 and 100).
   * @param {number} regionSettings.winter.humidity.night - The night humidity value to set for the winter (between 0 and 100).
   * @param {number} regionSettings.winter.humidity.var - The humidity variation value to set for the winter (between 0 and 50).
   * @param {Object} regionSettings.winter.wind - The winter wind settings to set for the scene.
   * @param {number} regionSettings.winter.wind.avg - The average wind value to set for the winter (between 0 and 70).
   * @param {number} regionSettings.winter.wind.var - The wind variation value to set for the winter (between 0 and 50).
   * @param {Object} regionSettings.winter.sun - The winter sun settings to set for the scene.
   * @param {number} regionSettings.winter.sun.hours - The sun hours value to set for the winter (between 1 and 23).
   * 
   * @returns {Promise<void>}
   * @throws {Error} If the user does not have permission to change scene settings or if an error occurs while updating the region settings.
   */
  async function setRegion(regionSettings) {
    Logger.debug('setRegion(...)', { 'regionSettings': regionSettings })
    if (!Permissions.hasPermission(Fal.userID(), 'sceneSettings')) {
      Logger.error('setRegion | ' + Fal.i18n('api.noPermission'))
      return
    }

    try {
      const safeRegionData = {
        'elevation': _checkParam(regionSettings, 'elevation', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 10000)) }),
        'vegetation': _checkParam(regionSettings, 'vegetation', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
        'waterAmount': _checkParam(regionSettings, 'waterAmount', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
        'summer': {
          'temperature': {
            'day': _checkParam(regionSettings, 'summer.temperature.day', 'number', (v) => { return Math.round(Utils.clamp(v, -30, 50)) }),
            'night': _checkParam(regionSettings, 'summer.temperature.night', 'number', (v) => { return Math.round(Utils.clamp(v, -30, 50)) }),
            'var': _checkParam(regionSettings, 'summer.temperature.var', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 20)) })
          },
          'humidity': {
            'day': _checkParam(regionSettings, 'summer.humidity.day', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
            'night': _checkParam(regionSettings, 'summer.humidity.night', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
            'var': _checkParam(regionSettings, 'summer.humidity.var', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 50)) })
          },
          'wind': {
            'avg': _checkParam(regionSettings, 'summer.wind.avg', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 70)) }),
            'var': _checkParam(regionSettings, 'summer.wind.var', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 50)) })
          },
          'sun': {
            'hours': _checkParam(regionSettings, 'summer.sun.hours', 'number', (v) => { return Math.round(Utils.clamp(v, 1, 23)) })
          }
        },
        'winter': {
          'temperature': {
            'day': _checkParam(regionSettings, 'winter.temperature.day', 'number', (v) => { return Math.round(Utils.clamp(v, -30, 50)) }),
            'night': _checkParam(regionSettings, 'winter.temperature.night', 'number', (v) => { return Math.round(Utils.clamp(v, -30, 50)) }),
            'var': _checkParam(regionSettings, 'winter.temperature.var', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 20)) })
          },
          'humidity': {
            'day': _checkParam(regionSettings, 'winter.humidity.day', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
            'night': _checkParam(regionSettings, 'winter.humidity.night', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 100)) }),
            'var': _checkParam(regionSettings, 'winter.humidity.var', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 50)) })
          },
          'wind': {
            'avg': _checkParam(regionSettings, 'winter.wind.avg', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 70)) }),
            'var': _checkParam(regionSettings, 'winter.wind.var', 'number', (v) => { return Math.round(Utils.clamp(v, 0, 50)) })
          },
          'sun': {
            'hours': _checkParam(regionSettings, 'winter.sun.hours', 'number', (v) => { return Math.round(Utils.clamp(v, 1, 23)) })
          }
        },
      }
      Logger.trace('setRegion(...)', { 'safeRegionData': safeRegionData })

      await Fal.setSceneFlag('regionSettings', safeRegionData)
      Logger.info('setRegion | ' + Fal.i18n('api.updateRegion'))

      const currentWeatherMode = Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)
      if (currentWeatherMode != GENERATOR_MODES.REGION_GENERATE) {
        await Fal.setSceneFlag('weatherMode', GENERATOR_MODES.REGION_GENERATE)
        Logger.info('setRegion | ' + Fal.i18n('api.updateWeatherMode') + GENERATOR_MODES.REGION_GENERATE)
      }
    } catch (error) {
      Logger.error('setRegion | ' + Fal.i18n('api.updateRegionFail') + error.message, true)
    }
  }

  /**
   * Sets the weather region template for the scene.
   * 
   * @param {string} [templateId=''] - The ID of the weather region template to be set.
   * @returns {Promise<void>} - A Promise that resolves after setting the weather region template.
   * @throws {Error} - If the user does not have permission to access the scene settings,
   * or if the template ID format is invalid, or if the specified module is inactive, or if the specified template does not exist.
   * 
   * @example
   * // Set the weather region template for the scene
   * await SceneWeather.setRegionTemplate('scene-weather.alpine');
   */
  async function setRegionTemplate(templateId = '') {
    Logger.debug('setRegionTemplate(...)', { 'templateId': templateId })
    if (!Permissions.hasPermission(Fal.userID(), 'sceneSettings')) {
      Logger.error('setRegionTemplate | ' + Fal.i18n('api.noPermission'))
      return
    }
    // test if weather with that template id exists
    if (!templateId.includes('.')) {
      Logger.error('setRegionTemplate | ' + Fal.i18n('api.setTemplate.idFormatInvalid'))
      return
    }
    const [moduleId, templateInnerId] = templateId.split('.')
    if (!Fal.isModuleActive(moduleId)) {
      Logger.error('setRegionTemplate | ' + Fal.i18n('api.setTemplate.moduleInactive') + moduleId)
      return
    }
    if (!Object.keys(SceneWeatherState._regionTemplates).includes(templateId)) {
      Logger.error('setRegionTemplate | ' + Fal.i18n('api.setTemplate.noSuchTemplate') + templateId)
      return
    }
    const regionTemplate = SceneWeatherState._regionTemplates[templateId]
    const currentTemplateId = Fal.getSceneFlag('regionTemplate', null)
    if (currentTemplateId != templateId) {
      await Fal.setSceneFlag('regionTemplate', templateId)
      Logger.info('setRegionTemplate | ' + Fal.i18n('api.setTemplate.updateRegionTemplate') + Fal.i18n(regionTemplate.name) + ' (' + templateId + ')')
    }
    const currentWeatherMode = Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)
    if (currentWeatherMode != GENERATOR_MODES.REGION_TEMPLATE) {
      await Fal.setSceneFlag('weatherMode', GENERATOR_MODES.REGION_TEMPLATE)
      Logger.info('setRegionTemplate | ' + Fal.i18n('api.updateWeatherMode') + GENERATOR_MODES.REGION_TEMPLATE)
    }
  }

  /**
   * A utility function for checking if a key exists in an object and optionally performs type checking and transformation on the value. It can also handle nested object keys.
   * 
   * @private
   * @param {Object} input - The object to check for the existence of the key.
   * @param {string} keyName - The key to check in the input object. Can be a nested key using dot notation (e.g. 'parent.child.grandchild').
   * @param {string|null} type - The type to check for the value. Can be any valid JavaScript type (e.g. 'string', 'number', 'object', 'array', etc.). If null, no type check is performed.
   * @param {function} transformer - A function to transform the value. The function takes the value as input and returns a transformed value. If no transformer is provided, the value is returned as is.
   * @returns {any} The value of the input object at the specified key after applying any specified type check and transformation.
   * @throws {Error} If the input object is null or an empty object, or if the keyName is not provided or does not exist in the input object, or if the type check fails.
   * @throws {Error} If the keyName is a nested key and any of the intermediate keys do not exist in the input object.
   * @throws {Error} If the keyName is a nested key and an error occurs while traversing the nested keys (e.g. due to a type mismatch or missing key).
   */
  function _checkParam(input = {}, keyName = '', type = null, transformer = (a) => { return a }) {
    if (!input || input == {} || !keyName) throw new Error('-')
    if (keyName.includes('.')) {
      // dice and calc
      const treeTop = keyName.split('.')[0]
      if (treeTop in input) {
        try {
          return _checkParam(input[treeTop], keyName.slice(treeTop.length + 1), type, transformer)
        } catch (error) {
          throw new Error(treeTop + '.' + error.message)
        }
      } else {
        Logger.debug('_checkParam failed: no such key', { 'input': input, 'treeTop': treeTop })
        throw new Error(treeTop)
      }
    } else {
      if (keyName in input) {
        const value = input[keyName]
        if (type != null) {
          // type check
          const vType = getType(value)
          if (vType != type) {
            Logger.debug('_checkParam failed: invalid type', { 'input': input, 'keyName': keyName, 'value': value, 'vType': vType, 'type': type })
            throw new Error(keyName + '{' + vType + '} != {' + type + '}')
          }
        }
        return transformer(value)
      } else {
        Logger.debug('_checkParam failed: no such key', { 'input': input, 'keyName': keyName })
        throw new Error(keyName)
      }
    }
  }


  return {
    clearScene: clearScene,
    updateWeatherConfig: updateWeatherConfig,
    updateWeather: updateWeather,
    getWeatherModel: getWeatherModel,
    getWeatherSettings: getWeatherSettings,
    getTokenAmbience: getTokenAmbience,
    setSeed: setSeed,
    setCycleTimes: setCycleTimes,
    setWeather: setWeather,
    setWeatherTemplate: setWeatherTemplate,
    setRegion: setRegion,
    setRegionTemplate: setRegionTemplate,
    registerPerciever: WeatherPerception.registeredPerciever,
    registerRegionTemplate: registerRegionTemplate,
    registerWeatherTemplate: registerWeatherTemplate,
    registerWeatherFxGenerator: registerWeatherFxGenerator,
    registerWeatherFxFilter: registerWeatherFxFilter,
    version: '1.0'
  }
}



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
import { SceneWeather } from './sceneWeather.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { SceneWeatherState } from './state.js'

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

  /**
   * Update the weather provider's configuration and internal precalculations as well as
   * invalidating the internal caches of the cascading weather modesla and region providers
   * if applicable.
   */
  async function updateWeatherConfig({ forSceneId = undefined, force = false } = {}) {
    Logger.debug('SceneWeather.updateWeatherConfig(...)', { 'forSceneId': forSceneId, 'force': force })
    // Update from configs
    const weatherProvider = _getSceneWeatherProvider(forSceneId, force)
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
   * Calculate the current weather for the current time and scene displayed based on the
   * configuration set by the scene's flags. Upon new weather information or changed
   * weather the event 'WeatherUpdated' is emitted with additional data attached.
   * 
   * force -> true: will always calculate the weather anew, wether it was calculated
   * already or not and emit the event.
   * 
   */
  async function updateWeather({ force = false, sceneId = undefined } = {}) {
    Logger.debug('SceneWeather.updateWeather(...)', { 'sceneId': sceneId, 'force': force, 'canvasSceneId': canvas.scene._id })
    if (sceneId === undefined) sceneId = canvas.scene._id
    if (sceneId != canvas.scene._id) return
    if (force) {
      SceneWeatherState._lastUpdate = -1
    }
    const currentTimeHash = TimeProvider.getCurrentTimeHash()
    if (SceneWeatherState._lastUpdate == currentTimeHash) return
    SceneWeatherState._lastUpdate = currentTimeHash
    const provider = _getSceneWeatherProvider(sceneId)
    if (provider !== undefined) {
      provider.calculateWeather({
        'force': force
      })
    }
  }

  /**
   * TODO
   */
  function registerRegionTemplate(moduleId = null, templateId = null, regionData = {}) {
    if (moduleId && templateId && regionData && Fal.isModuleEnabled(moduleId)) {
      // TODO use option inplace:false instead of deepClone ?
      regionData.id = moduleId + '.' + templateId
      const regionDataSafe = Utils.mergeObject(Utils.deepClone(DEFAULT_REGION_STRUCT), regionData, { insertKeys: false })
      SceneWeatherState._regionTemplates[regionDataSafe.id] = regionDataSafe
      Logger.debug('Registered regionTemplate for ' + moduleId + '.' + templateId, { 'regionData': regionDataSafe })
    } else {
      Logger.error('Unable to register RegionTemplate for moduleId:' + moduleId + ' with id:' + id, true)
    }
  }

  /**
   * TODO
   */
  function registerWeatherTemplate(moduleId = null, templateId = null, weatherData = {}) {
    if (moduleId && templateId && weatherData && Fal.isModuleEnabled(moduleId)) {
      weatherData.id = moduleId + '.' + templateId
      const weatherDataSafe = Utils.mergeObject(Utils.deepClone(DEFAULT_WEATHER_STRUCT), weatherData, { insertKeys: false })
      SceneWeatherState._weatherTemplates[moduleId + '.' + templateId] = weatherDataSafe
      Logger.debug('Registered weatherTemplate for ' + moduleId + '.' + templateId, { 'weatherData': weatherDataSafe })
    } else {
      Logger.error('Unable to register RegionTemplate for moduleId:' + moduleId + ' with id:' + id, true)
    }
  }

  /**
   * TODO
   */
  function registerWeatherFxGenerator(generatorId = null, getEmitterFunction = null) {
    Logger.debug('Registered weather fx generator for ' + generatorId)
    SceneWeatherState._generators.push({
      'name': generatorId,
      'getEmitter': getEmitterFunction
    })
  }

  /**
   * TODO
   */
  function registerWeatherFxFilter(filterId = null, getFilterConfigFunction = null) {
    Logger.debug('Registered weather fx filter for ' + filterId)
    SceneWeatherState._filters.push({
      'name': filterId,
      'getFilterConfig': getFilterConfigFunction
    })
  }



  /**
  * Returns the SceneWeather for the currently active scene
  * @private
  */
  function _getSceneWeatherProvider(forSceneId = undefined, ignoreCache = false) {
    let sceneId = canvas.scene._id
    if (forSceneId !== undefined) {
      sceneId = forSceneId
    }

    Logger.debug('api::getSceneWeatherProvider()', { 'forSceneId': forSceneId, 'sceneId': sceneId, 'ignoreCache': ignoreCache })

    if (ignoreCache) {
      SceneWeatherState._sceneWeather[sceneId] = undefined
    }
    if (SceneWeatherState._sceneWeather[sceneId] !== undefined) {
      return SceneWeatherState._sceneWeather[sceneId]
    }

    SceneWeatherState._sceneWeather[sceneId] = SceneWeather.fromConfig({
      'sceneId': sceneId
    })  // May also be undefined

    return SceneWeatherState._sceneWeather[sceneId]
  }



  return {
    updateWeatherConfig: updateWeatherConfig,
    updateWeather: updateWeather,
    registerPerciever: WeatherPerception.registeredPerciever,
    registerRegionTemplate: registerRegionTemplate,
    registerWeatherTemplate: registerWeatherTemplate,
    registerWeatherFxGenerator: registerWeatherFxGenerator,
    registerWeatherFxFilter: registerWeatherFxFilter,
    version: '1.0'
  }
}



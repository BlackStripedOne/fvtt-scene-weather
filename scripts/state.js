/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
This software has been made possible by my loving husband, who supports my hobbies by creating freetime for me. <3

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

import { SceneWeather } from './sceneWeather.js'
import { Logger, Utils } from './utils.js'

/**
 * Scene Weather's public API functions, attached to the foundry game object.
 */
export class SceneWeatherState {

  static _lastUpdate = 0  // last update in timeHash

  static _sceneWeather = {}  // cached instances of sceneWeather by scene ID

  // all region templates
  // templates can be registered via the api call SceneWeather.registerRegionTemplate(moduleId, templateId, weatherData)
  static _regionTemplates = {}

  // all static weather templates
  // templates can be registered via the api call SceneWeather.registerWeatherTemplate(moduleId, templateId, weatherData)
  static _weatherTemplates = {}

  // all registered generators
  // TODO change to object with unique ids
  static _generators = []

  // all registered filters
  static _filters = []

  /**
   * This private function is used to get the SceneWeather provider instance for the specified scene ID, or for the
   * currently active scene if no ID is specified. The function first checks if the canvas is ready, and if not, returns
   * undefined. Otherwise, it checks if the provider instance is already cached for the specified scene ID, and if so,
   * returns the cached instance. If the `ignoreCache` flag is set to true, the cached instance is invalidated, and a
   * new instance is generated for the specified scene ID. If the provider instance is not cached for the specified
   * scene ID, a new instance is generated and cached for future use. The function logs trace messages for cache hits
   * and misses, along with the relevant parameters and the provider instance.
   *
   * @private
   * @param {string|undefined} [forSceneId=undefined] - Optional scene ID to get the SceneWeather provider for. If not specified, the provider for the currently active scene will be returned.
   * @param {boolean} [ignoreCache=false] - Flag indicating whether to ignore the cache and generate a new instance of SceneWeather provider.
   * @returns {SceneWeather|undefined} The SceneWeather provider instance for the specified scene ID, or undefined if the canvas is not ready.
   */
  static getSceneWeatherProvider(forSceneId = undefined, ignoreCache = false) {
    if (!canvas || !canvas.ready) return undefined
    let sceneId = canvas.scene._id
    if (forSceneId !== undefined) {
      sceneId = forSceneId
    }

    // invalidate cache, if flag set
    if (ignoreCache) { SceneWeatherState._sceneWeather[sceneId] = undefined }

    // on cache hit
    if (SceneWeatherState._sceneWeather[sceneId] !== undefined) {
      return SceneWeatherState._sceneWeather[sceneId]
    }

    // else, cache miss generate new instance
    SceneWeatherState._sceneWeather[sceneId] = SceneWeather.fromConfig({
      'sceneId': sceneId
    })  // may also be undefined

    Logger.trace('SceneWeatherState.getSceneWeatherProvider(...) cacheMiss', { 'forSceneId': forSceneId, 'sceneId': sceneId, 'ignoreCache': ignoreCache, 'provider': SceneWeatherState._sceneWeather[sceneId] })
    return SceneWeatherState._sceneWeather[sceneId]
  }

}   // SceneWeatherApi

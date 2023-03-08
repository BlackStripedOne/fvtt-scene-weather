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

}   // SceneWeatherApi

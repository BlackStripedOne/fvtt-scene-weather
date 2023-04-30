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

import { MODULE } from '../constants.js'
import { Logger, Utils } from '../utils.js'
import { WeatherModel } from '../weatherModel.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

export class WeatherPerception {

  /**
   * Holds registered percievers for weather models.
   * id, instance of WeatherPerception descendant
   */
  static _registeredPercievers = {}

  /**
   * The singleton instance of the WeatherPerception singleton
   */
  static _singleton

  /**
   * Default weather info struct for forward compatibility
   */
  static DEFAULT_WEATHER_STRUCT = {
    'name': 'unknown',
    'temperature': {
      'air': 0,
      'ground': 0,
      'percieved': 0
    },
    'humidity': {
      'percent': 0
    },
    'wind': {
      'speed': 0,
      'gusts': 0,
      'direction': 0
    },
    'clouds': {
      'height': 0,
      'amount': 0,
      'type': 0
    },
    'sun': {
      'amount': 0
    },
    'precipitation': {
      'amount': 0,
      'type': 0
    }
  }

  /**
   * Default perciever infor struct for forward compatibility
   */
  static DEFAULT_INFO_STRUCT = {
    'id': MODULE.ID + '.default',
    'name': 'default'
  }

  /**
   * Register an instance of a WeatherPerception descendent class as a new perciever with a given id.
   * 
   * @param {String} id - the id to register the perciever as
   * @param {instance of WeatherPerception descendant} weatherPerception - the instance of the perciever to be used as this registered id
   */
  static registeredPerciever(moduleId = null, id = null, weatherPerception = null) {
    Logger.debug('WeatherPerception.registeredPerciever(...)', { 'moduleId': moduleId, 'id': id, 'weatherPerception': weatherPerception })
    if (moduleId && id && weatherPerception && weatherPerception instanceof WeatherPerception && Fal.isModuleEnabled(moduleId)) {
      WeatherPerception._registeredPercievers[moduleId + '.' + id] = weatherPerception
    } else {
      Logger.error('Unable to register WeatherPerciever for moduleId:' + moduleId + ' with id:' + id, true)
    }
  }

  /**
   * Get the given weatherModel in the form percieved as by the perciever module identified by the given id, if a perciever
   * with that id exists.
   * 
   * @param {String} id - the id of the perciever to be used to interpret the weatherModel data.
   * @param {*} weatherModel - the weatherModel data to be interpreted by the perciever
   * @returns String - the plaintext interpretation of the weatherModel as percieved by the perciever's instance.
   */
  static async getAsText(id = MODULE.ID + '.default', weatherModel) {
    const perciever = WeatherPerception._getPercieverById(id)
    const text = perciever.getTextFromModel(Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), weatherModel))
    Logger.debug('WeatherPerception.getAsText(...)', { 'id': id, 'perciever': perciever, 'text': text })
    return text
  }

  /**
   * Get the given weatherModel in the form percieved as by the perciever module identified by the given id, if a perciever
   * with that id exists.
   * 
   * @param {String} id - the id of the perciever to be used to interpret the weatherModel data.
   * @param {*} weatherModel - the weatherModel data to be interpreted by the perciever
   * @returns String - the html suitable for the UI interpretation of the weatherModel as percieved by the perciever's instance.
   */
  static async getAsUiHtml(id = MODULE.ID + '.default', weatherModel) {
    const perciever = WeatherPerception._getPercieverById(id)
    const uiHtml = perciever.getUiHtmlFromModel(Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), weatherModel))
    Logger.debug('WeatherPerception.getAsUiHtml(...)', { 'id': id, 'perciever': perciever, 'uiHtml': uiHtml })
    return uiHtml
  }

  /**
   * Get the given weatherModel in the form percieved as by the perciever module identified by the given id, if a perciever
   * with that id exists.
   * 
   * @param {String} id - the id of the perciever to be used to interpret the weatherModel data.
   * @param {*} weatherModel - the weatherModel data to be interpreted by the perciever
   * @returns String - the html suitable for the Chat message interpretation of the weatherModel as percieved by the perciever's instance.
   */
  static async getAsChatHtml(id = MODULE.ID + '.default', weatherModel) {
    const perciever = WeatherPerception._getPercieverById(id)
    const chatHtml = perciever.getChatHtmlFromModel(Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), weatherModel))
    Logger.debug('WeatherPerception.getAsChatHtml(...)', { 'id': id, 'perciever': perciever, 'chatHtml': chatHtml })
    return chatHtml
  }

  /**
   * Get the given weatherModel in the form percieved as by the perciever module identified by the given id, if a perciever
   * with that id exists.
   * 
   * @param {String} id - the id of the perciever to be used to interpret the weatherModel data.
   * @param {*} weatherModel - the weatherModel data to be interpreted by the perciever
   * @returns Object - the weatherInfo structure as interpretation of the weatherModel as percieved by the perciever's instance.
   */
  static async getAsWeatherInfo(id = MODULE.ID + '.default', weatherModel) {
    const perciever = WeatherPerception._getPercieverById(id)
    const weatherInfo = perciever.getWeatherInfoFromModel(Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), weatherModel))
    Logger.debug('WeatherPerception.getAsWeatherInfo(...)', { 'id': id, 'perciever': perciever, 'weatherInfo': weatherInfo })
    return weatherInfo
  }

  /**
   * Get the information structure of the perciever's instance.
   * 
   * @param {String} id - the id of the perciever to be used to interpret the weatherModel data.
   * @returns Object - the percievers information object.
   */
  static getInfo(id = MODULE.ID + '.default') {
    const perciever = WeatherPerception._getPercieverById(id)
    const percieverInfo = perciever.getPercieverInfo()
    Logger.debug('WeatherPerception.getInfo(...)', { 'id': id, 'perciever': perciever, 'percieverInfo': percieverInfo })
    return percieverInfo
  }

  /**
   * Returns an array of all perciever ids for which the given userId has permission to use or is configured to use.
   * 
   * @param {String} userId - the user's ID to be used for checking
   * @returns [String] - the array of allowed perciever ids for the given user.
   */
  static getAllowedIds(userId) {
    let allowedIds = []
    // TODO USe permission management here !
    // TODO use lambda
    for (const [id, perciever] of Object.entries(WeatherPerception._registeredPercievers)) {
      if (perciever.isAllowed(userId)) allowedIds.push(id)
    }
    Logger.debug('WeatherPerception.getAllowedIds(...)', { 'userId': userId, 'allowedIds': allowedIds })
    return allowedIds
  }

  /**
   * Returns the singleton instance of WeatherPerception
   * @returns WeatherPerception - the singleton instance
   */
  static _getSingleton() {
    if (!WeatherPerception._singleton) WeatherPerception._singleton = new WeatherPerception()
    return WeatherPerception._singleton
  }

  /**
   * Helper to return either the perciever for the given id or the default stub.
   * 
   * @param {String} id - the id of the perciever to be used to interpret the weatherModel data.
   * @returns 
   */
  static _getPercieverById(id) {
    if (WeatherPerception._registeredPercievers[id]) {
      return WeatherPerception._registeredPercievers[id]
    } else {
      return WeatherPerception._getSingleton()
    }
  }

  // abstract functions to overwrite

  /**
   * TODO 
   * @param {Object} weatherModel 
   * @returns 
   */
  getTextFromModel(weatherModel) {
    return ''
  }

  /**
   * TODO
   * 
   * @param {Object} weatherModel 
   * @returns 
   */
  getUiHtmlFromModel(weatherModel) {
    return ''
  }

  /**
   * TODO
   * 
   * @param {Object} weatherModel 
   * @returns 
   */
  getChatHtmlFromModel(weatherModel) {
    return ''
  }

  /**
   * TODO
   * 
   * @param {Object} weatherModel 
   * @returns 
   */
  getWeatherInfoFromModel(weatherModel) {
    return Utils.deepClone(WeatherPerception.DEFAULT_WEATHER_STRUCT)
  }

  /**
   * TODO
   * 
   * @returns 
   */
  getPercieverInfo() {
    return Utils.deepClone(WeatherPerception.DEFAULT_INFO_STRUCT)
  }
}

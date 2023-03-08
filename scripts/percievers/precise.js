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

import { Logger, Utils } from '../utils.js'
import { EVENTS, MODULE, CLOUD_TYPE, PRECI_TYPE } from '../constants.js'
import { WeatherPerception } from '../weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.REG_WEATHER_PERCIEVERS, async () => {
  SceneWeather.registerPerciever(MODULE.ID, 'precise', new PrecisePerciever())
})

class PrecisePerciever extends WeatherPerception {

  /**
   * @override WeatherPerception.isAllowed(userId)
   */
  isAllowed(userId) {
    // TODO use rights management
    return Fal.isGm(userId)
  }

  /**
   * @override WeatherPerception.getTextFromModel(weatherModel)
   */
  async getTextFromModel(weatherModel) {
    // TODO
    return JSON.stringify(this.getWeatherInfoFromModel(weatherModel))
  }

  /**
   * @override WeatherPerception.getUiHtmlFromModel(weatherModel)
   */
  async getUiHtmlFromModel(weatherModel) {
    const uiHtml = await renderTemplate('modules/' + MODULE.ID + '/templates/precisePerceptionUi.hbs', await this.getWeatherInfoFromModel(weatherModel))
    return uiHtml
  }

  /**
   * @override WeatherPerception.getChatHtmlFromModel(weatherModel)
   */
  async getChatHtmlFromModel(weatherModel) {
    return this.getUiHtmlFromModel(weatherModel)
  }

  /**
   * @override WeatherPerception.getWeatherInfoFromModel(modelData)
   */
  async getWeatherInfoFromModel(modelData) {
    const weatherInfo = Utils.mergeObject(Utils.deepClone(WeatherPerception.DEFAULT_WEATHER_STRUCT), {
      'temperature': {
        'air': modelData.temp.air.toFixed(1),
        'ground': modelData.temp.ground.toFixed(1),
        'percieved': modelData.temp.percieved.toFixed(1)
      },
      'humidity': {
        'percent': modelData.humidity.toFixed(1)
      },
      'wind': {
        'speed': Math.round(modelData.wind.speed),
        'gusts': Math.round(modelData.wind.gusts),
        'direction': Math.round(modelData.wind.direction)
      },
      'clouds': {
        'height': Math.round(modelData.clouds.bottom),
        'amount': Math.round(modelData.clouds.coverage * 100),
        'type': modelData.clouds.type,
        'typeId': PrecisePerciever._getCloudTypeId(modelData.clouds.type)
      },
      'sun': {
        'amount': Math.round(modelData.sun.amount * 100)
      },
      'precipitation': {
        'amount': Math.round(modelData.precipitation.amount * 100),
        'type': modelData.precipitation.type,
        'typeId': PrecisePerciever._getPrecipitationTypeId(modelData.precipitation.type)
      }
    })
    Logger.debug('PerceptivePerciever.getWeatherInfoFromModel()', { 'modelData': modelData, 'weatherInfo': weatherInfo })
    return weatherInfo
  }

  /**
   * @override WeatherPerception.getPercieverInfo()
   */
  getPercieverInfo() {
    const info = Utils.mergeObject(Utils.deepClone(WeatherPerception.DEFAULT_INFO_STRUCT), {
      'id': 'precise',
      'name': 'meteo.precise.name'
    })
    Logger.debug('PrecisePerciever.getPercieverInfo()', { 'info': info })
    return info
  }

  /**
    * Given a cloud type, returns a string identifier for the type in the format
    * "meteo.precise.cloudTypes.<type>".
    * @param {string} type - A string representing the cloud type to identify.
    * @returns {string} - A string identifier in the format "meteo.precise.cloudTypes.<type>".
    */
  static _getCloudTypeId(type) {
    const [suffix] = Object.entries(CLOUD_TYPE).find(([, val]) => val === type)
    return suffix ? `meteo.precise.cloudTypes.${suffix}` : 'meteo.precise.cloudTypes.cumulunimbus'
  }

  /**
  * Given a precipitation type, returns a string identifier for the type in the format
  * "meteo.precise.precipitationTypes.<type>".
  * @param {string} type - A string representing the precipitation type to identify.
  * @returns {string} - A string identifier in the format "meteo.precise.precipitationTypes.<type>".
  */
  static _getPrecipitationTypeId(type) {
    const [suffix] = Object.entries(PRECI_TYPE).find(([, val]) => val === type)
    return suffix ? `meteo.precise.precipitationTypes.${suffix}` : 'meteo.precise.precipitationTypes.none'
  }

}

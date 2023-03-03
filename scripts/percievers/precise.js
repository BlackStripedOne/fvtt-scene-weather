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
import { EVENTS, MODULE } from '../constants.js'
import { WeatherPerception } from '../weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.REG_WEATHER_PERCIEVERS, async () => {
  Logger.debug('registered weatherPerciever for precise')
  Utils.getApi().registerPerciever('precise', new PrecisePerciever())
})

class PrecisePerciever extends WeatherPerception {

  isAllowed(userId) {
    return Fal.isGm(userId)
  }

  async getTextFromModel(weatherModel) {
    return JSON.stringify(this.getWeatherInfoFromModel(weatherModel))
  }

  /*
   1 Air              humi
   2 Ground           perAmt
   3 Percieved        perTyp
   4 Speed            cloudTyp
   5 Gust             cloudAmt
   6 Direction        sunAmt
  */
  async getUiHtmlFromModel(weatherModel) {
    const uiHtml = await renderTemplate('modules/' + MODULE.ID + '/templates/precisePerceptionUi.hbs', await this.getWeatherInfoFromModel(weatherModel))
    return uiHtml
  }

  async getWeatherInfoFromModel(modelData) {
    const weatherInfo = Fal.mergeObject(WeatherPerception.DEFAULT_WEATHER_STRUCT, {
      'name': 'unknown',
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
        'type': modelData.clouds.type
      },
      'sun': {
        'amount': Math.round(modelData.sun.amount * 100)
      },
      'precipitation': {
        'amount': Math.round(modelData.precipitation.amount * 100),
        'type': modelData.precipitation.type
      }
    })
    Logger.debug('PerceptivePerciever.getWeatherInfoFromModel()', { 'modelData': modelData, 'weatherInfo': weatherInfo })
    return weatherInfo
  }


  getPercieverInfo() {
    const info = Fal.mergeObject(WeatherPerception.DEFAULT_INFO_STRUCT, {
      'id': 'precise',
      'name': 'meteo.preciseName'
    })
    Logger.debug('PrecisePerciever.getPercieverInfo()', { 'info': info })
    return info
  }

}

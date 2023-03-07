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
import { EVENTS, PRECI_TYPE, CLOUD_TYPE } from '../constants.js'
import { WeatherPerception } from '../weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.REG_WEATHER_PERCIEVERS, async () => {
  Logger.debug('registered weatherPerciever for vague')
  Utils.getApi().registerPerciever('vague', new VaguePerciever())
})

class VaguePerciever extends WeatherPerception {

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
    const compiledTemplate = Handlebars.compile(Utils.i18n('meteo.vague.templates.text'))
    const text = compiledTemplate(await this.getWeatherInfoFromModel(weatherModel))
    return text
  }

  /**
   * @override WeatherPerception.getUiHtmlFromModel(weatherModel)
   */
  async getUiHtmlFromModel(weatherModel) {
    const compiledTemplate = Handlebars.compile(Utils.i18n('meteo.vague.templates.ui'))
    const uiHtml = compiledTemplate(await this.getWeatherInfoFromModel(weatherModel))
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
    const temp = Math.round(modelData.temp.percieved / 5) * 5
    let weatherInfo = Fal.mergeObject(WeatherPerception.DEFAULT_WEATHER_STRUCT, {
      'temperature': {
        'air': temp,
        'ground': NaN,
        'percieved': temp
      },
      'humidity': {
        'percent': NaN
      },
      'wind': {
        'speed': NaN,
        'gusts': NaN,
        'direction': NaN
      },
      'clouds': {
        'height': NaN,
        'amount': Math.round(modelData.clouds.coverage * 10) * 10,
        'type': (modelData.clouds.type > CLOUD_TYPE.stratus) ? CLOUD_TYPE.cumulus : CLOUD_TYPE.none
      },
      'sun': {
        'amount': (modelData.sun.amount > 0.3) ? 1 : 0
      },
      'precipitation': {
        'amount': (modelData.precipitation.amount > 0.4) ? 1 : 0,
        'type': (modelData.precipitation.type > PRECI_TYPE.rain) ? PRECI_TYPE.rain : PRECI_TYPE.none
      },
      'modifiers': {
        'skyType': 'none',
        'tempType': 'none',
        'windType': 'none'
      }
    })

    if (modelData.clouds.type == CLOUD_TYPE.none) {
      weatherInfo.modifiers.skyType = 'meteo.vague.clear'
    } else if (modelData.clouds.type == CLOUD_TYPE.fog) {
      weatherInfo.modifiers.skyType = 'meteo.vague.fog'
    } else if (modelData.clouds.type >= CLOUD_TYPE.stratus) {
      switch (modelData.precipitation.type) {
        case PRECI_TYPE.blizzard:
        case PRECI_TYPE.snow:
          weatherInfo.modifiers.skyType = 'meteo.vague.snow'
          break
        case PRECI_TYPE.hail:
        case PRECI_TYPE.downpour:
          weatherInfo.modifiers.skyType = 'meteo.vague.downpour'
          if (modelData.clouds.type >= CLOUD_TYPE.cumulunimbus) weatherInfo.modifiers.skyType = 'meteo.vague.thunderstorm'
          break
        case PRECI_TYPE.rain:
          weatherInfo.modifiers.skyType = 'meteo.vague.rain'
          if (modelData.clouds.type >= CLOUD_TYPE.cumulunimbus) weatherInfo.modifiers.skyType = 'meteo.vague.thunderstorm'
          break
        case PRECI_TYPE.drizzle:
          weatherInfo.modifiers.skyType = 'meteo.vague.drizzle'
          break
        case PRECI_TYPE.none:
        default:
          weatherInfo.modifiers.skyType = 'meteo.vague.cloudy'
          break
      }
    }
    if (temp > 30) {
      weatherInfo.modifiers.tempType = 'meteo.vague.warm'
      if (modelData.wind.speed > 40) weatherInfo.modifiers.windType = 'meteo.vague.windy'
    } else if (temp < 5) {
      weatherInfo.modifiers.tempType = 'meteo.vague.cold'
      if (modelData.wind.speed > 40) weatherInfo.modifiers.windType = 'meteo.vague.windy'
    }
    Logger.debug('VaguePerciever.getWeatherInfoFromModel()', { 'modelData': modelData, 'weatherInfo': weatherInfo })
    return weatherInfo
  }

  /**
   * @override WeatherPerception.getPercieverInfo()
   */
  getPercieverInfo() {
    const info = Fal.mergeObject(WeatherPerception.DEFAULT_INFO_STRUCT, {
      'id': 'vague',
      'name': 'meteo.vague.name'
    })
    Logger.debug('VaguePerciever.getPercieverInfo()', { 'info': info })
    return info
  }

}

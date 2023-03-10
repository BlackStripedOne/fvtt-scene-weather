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
import { Permissions } from '../permissions.js'

Hooks.on(EVENTS.REG_WEATHER_PERCIEVERS, async () => {
  SceneWeather.registerPerciever(MODULE.ID, 'icon', new IconPerciever())
})

const PREFIX = 'meteo.icon.'

class IconPerciever extends WeatherPerception {

  /**
   * @override WeatherPerception.isAllowed(userId)
   */
  isAllowed(userId) {
    return Permissions.hasPermission(userId, 'perciever.scene-weather.icon')
  }

  /**
   * @override WeatherPerception.getTextFromModel(weatherModel)
   */
  async getTextFromModel(weatherModel) {
    const compiledTemplate = Handlebars.compile(Fal.i18n('meteo.icon.templates.text'))
    const text = compiledTemplate(await this.getWeatherInfoFromModel(weatherModel))
    return text
  }

  /**
   * @override WeatherPerception.getUiHtmlFromModel(weatherModel)
   */
  async getUiHtmlFromModel(weatherModel) {
    const uiHtml = await renderTemplate('modules/' + MODULE.ID + '/templates/iconPerceptionUi.hbs', await this.getWeatherInfoFromModel(weatherModel))
    return uiHtml
  }

  /**
   * @override WeatherPerception.getChatHtmlFromModel(weatherModel)
   */
  async getChatHtmlFromModel(weatherModel) {
    const chatHtml = await renderTemplate('modules/' + MODULE.ID + '/templates/iconPerceptionChat.hbs',
      Utils.mergeObject({
        'description': await this.getTextFromModel(weatherModel)
      },
        await this.getWeatherInfoFromModel(weatherModel)))
    return chatHtml
  }

  /**
   * @override WeatherPerception.getWeatherInfoFromModel(modelData)
   */
  async getWeatherInfoFromModel(modelData) {
    let weatherInfo = Utils.mergeObject(Utils.deepClone(WeatherPerception.DEFAULT_WEATHER_STRUCT), {
      'temperature': {
        'air': modelData.temp.air.toFixed(1),
        'ground': modelData.temp.ground.toFixed(1),
        'percieved': modelData.temp.percieved.toFixed(1)
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
        'amount': Math.round(modelData.clouds.coverage * 30) * 30,
        'type': modelData.clouds.type
      },
      'sun': {
        'amount': (modelData.sun.amount > 0.3) ? 1 : 0
      },
      'precipitation': {
        'amount': (modelData.precipitation.amount > 0.4) ? 1 : 0,
        'type': modelData.precipitation.type
      },
      'composite': {
        'sun': (modelData.sun.amount > 0.3) ? 'sun' : 'none',
        'clouds': 'none',
        'preci': 'none',
        'wind': 'none'
      },
      'descriptive': {
        'sun': (modelData.sun.amount > 0.3) ? PREFIX + 'sun.sun' : PREFIX + 'sun.none',
        'clouds': PREFIX + 'clouds.none',
        'preci': PREFIX + 'precipitation.none',
        'wind': PREFIX + 'wind.none'
      }
    })

    switch (modelData.clouds.type) {
      case CLOUD_TYPE.fog:
        weatherInfo.composite.clouds = 'fog'
        weatherInfo.descriptive.clouds = PREFIX + 'clouds.fog'
        return weatherInfo
      case CLOUD_TYPE.stratus:
      case CLOUD_TYPE.cumulus:
        weatherInfo.composite.clouds = 'cloud'
        weatherInfo.descriptive.clouds = PREFIX + 'clouds.cloud'
        break
      case CLOUD_TYPE.cumulunimbus:
        weatherInfo.composite.clouds = 'thunder'
        weatherInfo.descriptive.clouds = PREFIX + 'clouds.thunder'
        break
    }
    switch (modelData.precipitation.type) {
      case PRECI_TYPE.drizzle:
        weatherInfo.composite.preci = 'lightRain'
        weatherInfo.descriptive.preci = PREFIX + 'precipitation.lightRain'
        break
      case PRECI_TYPE.rain:
      case PRECI_TYPE.downpour:
        weatherInfo.composite.preci = 'rain'
        weatherInfo.descriptive.preci = PREFIX + 'precipitation.rain'
        break
      case PRECI_TYPE.hail:
      case PRECI_TYPE.snow:
        weatherInfo.composite.preci = 'lightSnow'
        weatherInfo.descriptive.preci = PREFIX + 'precipitation.lightSnow'
        break
      case PRECI_TYPE.blizzard:
        weatherInfo.composite.preci = 'snow'
        weatherInfo.descriptive.preci = PREFIX + 'precipitation.snow'
        break
    }
    if (modelData.wind.speed > 50) {
      weatherInfo.composite.wind = 'wind'
      weatherInfo.descriptive.preci = PREFIX + 'wind.wind'
    }
    Logger.debug('IconPerciever.getWeatherInfoFromModel()', { 'modelData': modelData, 'weatherInfo': weatherInfo })
    return weatherInfo
  }

  /**
   * @override WeatherPerception.getPercieverInfo()
   */
  getPercieverInfo() {
    const info = Utils.mergeObject(Utils.deepClone(WeatherPerception.DEFAULT_INFO_STRUCT), {
      'id': 'icon',
      'name': Fal.i18n(PREFIX + 'name')
    })
    Logger.debug('IconPerciever.getPercieverInfo()', { 'info': info })
    return info
  }

}

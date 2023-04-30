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

import { PRECI_TYPE, CLOUD_TYPE, AMBIENCE_TYPE, EVENTS, WIND_SPEED } from '../constants.js'
import { Logger, Utils } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { SceneWeatherState } from '../state.js'

// on
//  - movement
Hooks.on('updateToken', async (doc, change, flags, id) => {
  //Logger.debug('->Hook:updateToken  -> (...)', { 'doc': doc, 'change': change, 'flags': flags, 'id': id })
  Fal.getControlledTokens().forEach((token) => {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    if (ambienceModel) {
      Logger.trace('Hook:WeatherUpdated -> updateSounds for token', {
        token: token,
        ambienceModel: ambienceModel
      })
      if (canvas.sceneweather.sfxHandler) {
        canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, true)
      }
    }
  })
})

Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  // Logger.debug('->Hook:WeatherUpdated -> update token ambiences', { 'data': data })
  Fal.getControlledTokens().forEach((token) => {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    if (ambienceModel) {
      Logger.trace('Hook:WeatherUpdated -> updateSounds for token', {
        token: token,
        ambienceModel: ambienceModel
      })
      if (canvas.sceneweather.sfxHandler) {
        canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, true)
      }
    }
  })
})

// on
//  - deselect token
//  - select token
Hooks.on('controlToken', async (token, tokenControl) => {
  // Logger.debug('->Hook:controlToken  -> (...)', { 'token': token, 'tokenControl': tokenControl })
  if (tokenControl) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    if (!ambienceModel) return
    if (canvas.sceneweather.sfxHandler) {
      canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, false)
    }
  } else {
    if (canvas.sceneweather.sfxHandler) {
      canvas.sceneweather.sfxHandler.disableAllSounds(false)
    }
  }
})

const AMBIENCE_STRUCT = {
  temp: {
    actual: 0, // degrees celsius
    percieved: 0 // degrees celsius
  },
  humidity: 0, // percent
  precipitation: {
    type: PRECI_TYPE.none,
    cloudType: CLOUD_TYPE.none,
    amount: 0 // percent
  },
  windSpeed: 0,
  sun: {
    amount: 0 // percent sunshine
  },
  condition: AMBIENCE_TYPE.outside
}

/**
 * TODO
 */
export class TokenAmbience {
  // Internal model
  static getAmbienceModelForToken(token) {
    if (!token || !token instanceof Token) return undefined
    if (!token || !canvas || !canvas.ready) return undefined
    // no SceneWeather enabled, no ambience
    const weatherProvider = SceneWeatherState.getSceneWeatherProvider()
    if (!weatherProvider) return undefined
    return TokenAmbience.getAmbienceModelForPosition(
      token.center || { x: -1, y: -1 },
      weatherProvider
    )
  }

  /**
   * TODO Internal representation, not for API use
   * @calledBy API -> Should NOT
   */
  static getAmbienceModelForPosition({ x = 0, y = 0 } = {}, weatherProvider) {
    const weatherModel = weatherProvider.getWeatherModel()
    if (weatherModel) {
      let weatherModelAtPosition = Utils.mergeObject(weatherModel, {
        condition: AMBIENCE_TYPE.outside,
        base: Utils.deepClone(weatherModel)
      })
      let filteredWeatherModel = weatherModelAtPosition
      canvas.sceneweather.getNodesAt({ x: x, y: y, onlyEnabled: true }).forEach((weatherNode) => {
        filteredWeatherModel = weatherNode.filterWeatherModel(
          filteredWeatherModel,
          weatherModelAtPosition
        )
      })
      return filteredWeatherModel
    } else {
      return undefined
    }
  }

  // TODO to external representation
  static getAmbienceForPosition(options, weatherProvider) {
    return TokenAmbience.getAmbienceModelForPosition(options, weatherProvider)
  }
}

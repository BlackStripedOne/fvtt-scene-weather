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
  Logger.trace('TokenAmbience:updateToken  -> (...)', { 'doc': doc, 'change': change, 'flags': flags, 'id': id })
  Fal.getControlledTokens().forEach((token) => {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('updateToken', { 'token': token, 'ambienceModel': ambienceModel })
    if (ambienceModel) {
      if (canvas.sceneweather.sfxHandler) {
        canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, true)
      }
      // set ambience to token
      TokenAmbience.injectAmbienceToToken(token, ambienceModel)
    }
  })
})

Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  Logger.trace('TokenAmbience:weatherUpdated', { 'data': data })
  Fal.getOwnedTokens().forEach((token) => {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('weatherUpdated', { 'token': token, 'ambienceModel': ambienceModel })
    if (ambienceModel) {
      if (canvas.sceneweather.sfxHandler && token.controlled) {
        canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, true)
      }
      // set ambience to token
      TokenAmbience.injectAmbienceToToken(token, ambienceModel)
    }
  })
})

// handle creation of new tokens on the layer
Hooks.on('refreshToken', async (token, options) => {
  if (token.isOwner && !('ambience' in token)) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('createToken', { 'token': token, 'ambienceModel': ambienceModel })
    if (ambienceModel) {
      // set ambience to token
      TokenAmbience.injectAmbienceToToken(token, ambienceModel)
    }
  }

})

// on
//  - deselect token
//  - select token
Hooks.on('controlToken', async (token, tokenControl) => {
  Logger.trace('TokenAmbience:controlToken', { 'token': token, 'tokenControl': tokenControl })
  if (tokenControl) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('controlToken', { 'token': token, 'ambienceModel': ambienceModel })
    if (!ambienceModel) return
    if (canvas.sceneweather.sfxHandler) {
      canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, false)
    }
    // set ambience to token
    TokenAmbience.injectAmbienceToToken(token, ambienceModel)
  } else {
    if (canvas.sceneweather.sfxHandler) {
      canvas.sceneweather.sfxHandler.disableAllSounds(false)
    }
  }
})

/**
 * TODO
 */
export class TokenAmbience {

  static AMBIENCE_STRUCT = {
    temp: {
      actual: 0, // degrees celsius
      percieved: 0 // degrees celsius
    },
    humidity: 0, // percent
    clouds: {
      type: CLOUD_TYPE.none,
      amount: 0 // percent
    },
    precipitation: {
      type: PRECI_TYPE.none,
      amount: 0 // percent
    },
    wind: {
      speed: 0,
      direction: 0
    },
    sun: {
      amount: 0 // percent sunshine
    },
    condition: AMBIENCE_TYPE.outside
  }


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

  static injectAmbienceToToken(token, ambienceModel) {
    // set ambience to token
    const ambienceData = TokenAmbience.getAmbienceForPosition({ 'ambienceModel': ambienceModel })
    if (!('ambience' in token)) token.ambience = {}
    token.ambience = Utils.mergeObject(token.ambience, ambienceData)

    // debugging toast
    if (canvas.sceneweather.debugToast) {
      ambienceData.tokenName = token.name
      ambienceData.tokenId = 'Token.' + token.id
      ambienceData.x = token.x
      ambienceData.y = token.y
      canvas.sceneweather.debugToast.setDebugData('ambience', ambienceData)
    }
  }

  // TODO to external representation
  static getAmbienceForPosition({ x, y, ambienceModel } = {}, weatherProvider) {
    if (ambienceModel === undefined) {
      if (weatherProvider) {
        ambienceModel = TokenAmbience.getAmbienceModelForPosition({ x, y }, weatherProvider)
      } else {
        return Utils.deepClone(TokenAmbience.AMBIENCE_STRUCT)
      }
    }
    // transfer model to external mergeObject
    const ambience = Utils.mergeObject(Utils.deepClone(TokenAmbience.AMBIENCE_STRUCT), {
      temp: {
        actual: Math.round(ambienceModel.temp.air), // degrees celsius
        percieved: Math.round(ambienceModel.temp.percieved) // degrees celsius
      },
      humidity: Math.round(ambienceModel.humidity), // percent
      clouds: {
        type: Utils.getKeyByValue(CLOUD_TYPE, ambienceModel.clouds.type, 'unknown'),
        amount: Math.round(ambienceModel.clouds.coverage * 100) // in percent
      },
      precipitation: {
        type: Utils.getKeyByValue(PRECI_TYPE, ambienceModel.precipitation.type, 'unknown'),
        amount: Math.round(ambienceModel.precipitation.amount * 100) // in percent
      },
      wind: {
        speed: Math.round(ambienceModel.wind.speed), // in km/h
        direction: Math.round(ambienceModel.wind.direction) // in degree
      },
      sun: {
        amount: Math.round(ambienceModel.sun.amount * 100) // in percent
      },
      condition: Utils.getKeyByValue(AMBIENCE_TYPE, ambienceModel.condition, 'unknown')
    })
    Logger.trace('TokenAmbience.getAmbienceForPosition(...)', { 'weatherProvider': weatherProvider, 'ambienceModel': ambienceModel, 'ambience': ambience })
    return ambience
  }
}

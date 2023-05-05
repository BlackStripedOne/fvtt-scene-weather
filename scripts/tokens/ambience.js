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

import { PRECI_TYPE, CLOUD_TYPE, AMBIENCE_TYPE, EVENTS } from '../constants.js'
import { Logger, Utils } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { SceneWeatherState } from '../state.js'

/**
 * This function is an event listener that is triggered when a token is updated. In this case for the movement only.
 * It updates the ambience for each controlled token on the canvas based on the current ambience model.
 * @param {object} doc - The document associated with the token being updated.
 * @param {object} change - The change that is being made to the token.
 * @param {object} flags - Any flags that are associated with the update.
 * @param {string} id - The id of the token being updated.
 */
Hooks.on('updateToken', async (doc, change, flags, id) => {
  Logger.trace('TokenAmbience:updateToken  -> (...)', {
    doc: doc,
    change: change,
    flags: flags,
    id: id
  })
  for (const token of Fal.getControlledTokens()) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('updateToken', { token: token, ambienceModel: ambienceModel })
    if (ambienceModel) {
      if (canvas.sceneweather.sfxHandler) {
        canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, true)
      }
      // set ambience to token
      TokenAmbience.injectAmbienceToToken(token, ambienceModel)
    }
  }
})

/**
 * Hooks into the weather updated event to update the ambience for owned tokens.
 * This will update the ambience on all owned tokwns of the current player.
 * @param {Function} async (data) => {...} - The function to be called when the event is triggered.
 */
Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  Logger.trace('TokenAmbience:weatherUpdated', { data: data })
  for (const token of Fal.getOwnedTokens()) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('weatherUpdated', { token: token, ambienceModel: ambienceModel })
    if (ambienceModel) {
      if (canvas.sceneweather.sfxHandler && token.controlled) {
        canvas.sceneweather.sfxHandler.updateSounds(ambienceModel, true)
      }
      // set ambience to token
      TokenAmbience.injectAmbienceToToken(token, ambienceModel)
    }
  }
})

/**
 * This function handles the creation of new tokens on the layer. It is triggered by
 * the 'refreshToken' hook.
 * @param {Token} token - The token that is being refreshed.
 * @param {Object} options - Additional options for the token refresh.
 */
Hooks.on('refreshToken', async (token, options) => {
  if (token.isOwner && !('ambience' in token)) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('createToken', { token: token, ambienceModel: ambienceModel })
    if (ambienceModel) {
      // set ambience to token
      TokenAmbience.injectAmbienceToToken(token, ambienceModel)
    }
  }
})

/**
 * The callback function registered by this code will be triggered when the control of a
 * Token changes and will execute the following logic:
 * If the tokenControl parameter is true, it will get the ambienceModel for the token using
 * the TokenAmbience.getAmbienceModelForToken() method and update any scene weather sound
 * effects using the canvas.sceneweather.sfxHandler.updateSounds() method. Finally, it will
 * inject the ambienceModel to the token using the TokenAmbience.injectAmbienceToToken() method.
 * If the tokenControl parameter is false, it will disable all scene weather sound effects
 * using the canvas.sceneweather.sfxHandler.disableAllSounds() method.
 * @param {Token} token - The Token whose control has changed.
 * @param {boolean} tokenControl - A boolean indicating whether the Token is currently under the control of a player.
 */
Hooks.on('controlToken', async (token, tokenControl) => {
  Logger.trace('TokenAmbience:controlToken', { token: token, tokenControl: tokenControl })
  if (tokenControl) {
    const ambienceModel = TokenAmbience.getAmbienceModelForToken(token)
    Logger.trace('controlToken', { token: token, ambienceModel: ambienceModel })
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
 * A static class that provides methods to retrieve and inject ambience data for tokens.
 * Ambience data contains information about the weather conditions at a given position, such as
 * temperature, humidity, clouds, precipitation, wind, and sun.
 * It uses a weather provider to get the weather model for a given position and filters
 * it through any SceneWeather nodes at the position to get the final ambience data.
 * The class also provides methods to inject the ambience data into a token object.
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

  /**
   * Retrieves the ambience model for a given token, based on its position and the scene weather.
   * @param {Token} token - The token for which to retrieve the ambience model.
   */
  static getAmbienceModelForToken(token) {
    if (!token || !token instanceof Token) return
    if (!token || !canvas || !canvas.ready) return
    // no SceneWeather enabled, no ambience
    const weatherProvider = SceneWeatherState.getSceneWeatherProvider()
    if (!weatherProvider) return
    return TokenAmbience.getAmbienceModelForPosition(
      token.center || { x: -1, y: -1 },
      weatherProvider
    )
  }

  /**
   * Returns the ambience model for the given position and weather provider. This is returning the internal representation only.
   * @param {Object} [position={ x: 0, y: 0 }] - The position object with x and y properties.
   * @param {Object} weatherProvider - The weather provider object.
   * @returns {Object|undefined} The filtered weather model with the ambience type set to "outside", or undefined if the weather model is not available.
   * @calledBy API -> Should NOT be used for external use
   */
  static getAmbienceModelForPosition({ x = 0, y = 0 } = {}, weatherProvider) {
    const weatherModel = weatherProvider.getWeatherModel()
    if (weatherModel) {
      let weatherModelAtPosition = Utils.mergeObject(weatherModel, {
        condition: AMBIENCE_TYPE.outside,
        base: Utils.deepClone(weatherModel)
      })
      let filteredWeatherModel = weatherModelAtPosition
      for (const weatherNode of canvas.sceneweather.getNodesAt({ x: x, y: y, onlyEnabled: true })) {
        filteredWeatherModel = weatherNode.filterWeatherModel(
          filteredWeatherModel,
          weatherModelAtPosition
        )
      }
      return filteredWeatherModel
    } else {
      return
    }
  }

  /**
   * Injects the ambience to a given token.
   * @param {Object} token - The token object to inject the ambience to.
   * @param {Object} ambienceModel - The ambience model to use.
   */
  static injectAmbienceToToken(token, ambienceModel) {
    // set ambience to token
    const ambienceData = TokenAmbience.getAmbienceForPosition({ ambienceModel: ambienceModel })
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
  
  /**
   * Returns the ambience data for a given position using an ambience model or a weather provider. This returns the external
   * representation attached to the tokens. The structure is TokenAmbience.AMBIENCE_STRUCT.
   * @param {Object} [params={}] - The parameters object.
   * @param {number} [params.x] - The x coordinate of the position.
   * @param {number} [params.y] - The y coordinate of the position.
   * @param {Object} [params.ambienceModel] - The ambience model object.
   * @param {Object} [weatherProvider] - The weather provider object.
   * @returns {Object} - The ambience data object. TokenAmbience.AMBIENCE_STRUCT
   */
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
    Logger.trace('TokenAmbience.getAmbienceForPosition(...)', {
      weatherProvider: weatherProvider,
      ambienceModel: ambienceModel,
      ambience: ambience
    })
    return ambience
  }
}

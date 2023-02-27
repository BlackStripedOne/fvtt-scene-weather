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

import { MODULE } from './constants.js'

/**
 * Console logger
 */
export class Logger {
  static info(message, notify = false) {
    console.log(MODULE.NAME + ` Info | ${message}`)
    if (notify) ui.notifications.info(MODULE.NAME + ` | ${message}`)
  }

  static error(message, notify = false) {
    console.error(MODULE.NAME + ` Error | ${message}`)
    if (notify) ui.notifications.error(MODULE.NAME + ` | ${message}`)
  }

  static debug(message, data) {
    const isDebug = (game.gmTokenTools) ? game.gmTokenTools.isDebug : Utils.getSetting('debug', false)
    if (isDebug) {
      if (!data) {
        console.log(MODULE.NAME + ` Debug | ${message}`)
        return
      }
      const dataClone = Utils.deepClone(data)
      console.log(MODULE.NAME + ` Debug | ${message}`, dataClone)
    }
  }
}

/**
 * Utilit class for generic fvtt ease-of-uses
 */
export class Utils {

  /**
  * Returns the SceneWeather API instance.
  * @returns {Object} The SceneWeather API instance.
  */
  static getApi() {
    return game.sceneWeather
  }

  /**
   * Clamps a number between a minimum and maximum value.
   * 
   * @param {number} number - The number to clamp.
   * @param {number} min - The minimum value the number can be.
   * @param {number} max - The maximum value the number can be.
   * @returns {number} The clamped number.
   * 
   */
  static clamp(number, min, max) {
    return Math.min(Math.max(number, min), max)
  }

  /**
   * Maps a value from one range to another range.
   * 
   * @param {number} current - The value to map.
   * @param {number} inMin - The minimum value of the current range.
   * @param {number} inMax - The maximum value of the current range.
   * @param {number} outMin - The minimum value of the target range.
   * @param {number} outMax - The maximum value of the target range.
   * @returns {number} The mapped value.
   * 
   * @example
   * const current = 50;
   * const inMin = 0;
   * const inMax = 100;
   * const outMin = 0;
   * const outMax = 1;
   * const mappedValue = map(current, inMin, inMax, outMin, outMax); // Returns 0.5
   */
  static map(current, inMin, inMax, outMin, outMax) {
    const mapped = ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    return Utils.clamp(mapped, outMin, outMax)
  }

  /**
   * Maps a numeric value between two ranges to a color value between two hexadecimal values.
   * @param {number} current - The numeric value to map.
   * @param {number} inMin - The minimum value of the input range.
   * @param {number} inMax - The maximum value of the input range.
   * @param {string} hexMin - The hexadecimal color value for the minimum output.
   * @param {string} hexMax - The hexadecimal color value for the maximum output.
   * @returns {string} - The hexadecimal color value that corresponds to the mapped value.
*/
  static mapColorHex(current, inMin, inMax, hexMin, hexMax) {
    const { r: redMin, g: greenMin, b: blueMin } = foundry.utils.Color.from(hexMin)
    const { r: redMax, g: greenMax, b: blueMax } = foundry.utils.Color.from(hexMax)
    return foundry.utils.Color.fromRGB([
      Utils.map(current, inMin, inMax, redMin, redMax),
      Utils.map(current, inMin, inMax, greenMin, greenMax),
      Utils.map(current, inMin, inMax, blueMin, blueMax)
    ]).toString()
  }

  /**
   * Round a number to the given number of decimals.
   * @param {number} number   The number to round
   * @param {number} decimals The number of decimals to round to
   * @returns {number} The rounded result
   */
  static roundToDecimals(number, decimals) {
    return Number(Math.round(number + "e" + decimals) + "e-" + decimals);
  }

  /**
   * Omit a specific key from an object.
   * @param {object} object The object from which to omit
   * @param {string|number|symbol} key The key to omit
   * @returns {object} The object without the given key.
   */
  static omit(object, key) {
    const { [key]: _omitted, ...rest } = object;
    return rest;
  }

  /**
   * Checks if a given bit in a given number is set.
   * 
   * @param {number} num The number to check.
   * @param {number} bit The bit number to check (0-based index).
   * @returns {object} `true` if the specified bit is set, `false` otherwise.
   */
  static isBitSet(num, bit) {
    return (num & (1 << bit)) !== 0
  }


  /**
   * Foundry VTT's deepClone function wrapped here to avoid code error highlighting due to missing definition.
   * 
   * @param {*} original
   * @param {*} options
   */
  static deepClone(original, options) {
    // eslint-disable-next-line no-undef
    return deepClone(original, options)
  }

  /**
   * Get actor from the token or actor object
   * 
   * @param {string} actorId The actor id
   * @param {string} tokenId The token id
   * @returns {object}       The actor
   */
  static getActor(actorId, tokenId) {
    let token = null
    if (tokenId) token = canvas.tokens.placeables.find((token) => token.id === tokenId)
    if (token) return token.actor
    return game.actors.get(actorId)
  }

  /**
   * Get item from the actor object
   * 
   * @param {object} actor  The actor
   * @param {string} itemId The item id
   * @returns {object}      The item
   */
  static getItem(actor, itemId) {
    return actor.items.get(itemId)
  }

  /**
   * Get token
   * 
   * @param {string} tokenId The token id
   * @returns {object}       The token
   */
  static getToken(tokenId) {
    return canvas.tokens.placeables.find((token) => token.id === tokenId)
  }

  /**
   * Get controlled tokens
   * 
   * @returns {array} The controlled tokens
   */
  static getControlledTokens() {
    return game.canvas.tokens.controlled
  }

  /**
   * Get one controlled tokens
   * 
   * @returns {object} The first controlled token
   */
  static getControlledToken() {
    return game.canvas.tokens.controlled[0]
  }

  /**
   * Get the user object owning and controling the given token
   * 
   * @param {Token} token - the token to search the owner for
   * @returns {User} - the user owning and controling the token, undefined in case none was found
   */
  static getUserByTokenId(token) {
    let ownerships = token.actor.ownership
    let foundUser = undefined
    game.users.forEach((user) => {
      if (user.character !== null && user.active) {
        if (ownerships[user._id] > 0) foundUser = user
      }
    })
    return foundUser
  }

  /**
   * Get setting value
   * 
   * @param {string} key               The setting key
   * @param {string=null} defaultValue The setting default value
   * @returns {*}                      The setting value
   */
  static getSetting(key, defaultValue = null) {
    let value = defaultValue ?? null
    try {
      value = game.settings.get(MODULE.ID, key)
    } catch {
      console.log(MODULE.NAME + ` Debug | GameConfig '${key}' not found`)
    }
    return value
  }

  /**
   * Set setting value
   * 
   * @param {string} key   The setting key
   * @param {string} value The setting value
   */
  static async setSetting(key, value) {
    if (game.settings.settings.get(`${MODULE.ID}.${key}`)) {
      await game.settings.set(MODULE.ID, key, value)
      Logger.debug(`GameConfig '${key}' set to '${value}'`)
    } else {
      Logger.debug(`GameConfig '${key}' not found`)
    }
  }

  /**
   * Get scene flag value
   * 
   * @param {string} key               The scene flag key
   * @param {string=null} defaultValue The scene flag default value
   * @returns {*}                      The scene flag value or defaultValue, null as fallback
   */
  static getSceneFlag(key, defaultValue = null) {
    let value = defaultValue ?? null
    try {
      value = canvas.scene?.getFlag(MODULE.ID, key) ?? defaultValue
    } catch {
      Logger.debug(`SceneFlag '${key}' not found on current scene`)
    }
    return value
  }

  /**
   * Get module user flag
   * 
   * @param {string} key The flag key
   * @returns {*}        The flag value
   */
  static getUserFlag(key) {
    return game.user.getFlag(MODULE.ID, key)
  }

  /**
   * Set module user flag
   * 
   * @param {string} key The flag key
   * @param {*} value    The flag value
   */
  static async setUserFlag(key, value) {
    await game.user.setFlag(MODULE.ID, key, value)
  }

  /**
   * Unset module user flag
   * 
   * @param {string} key The flag key
   */
  static async unsetUserFlag(key) {
    await game.user.unsetFlag(MODULE.ID, key)
  }

  /**
   * Language translation
   * 
   * @param {string} toTranslate The value to translate
   * @returns {string} The translated value
   */
  static i18n(toTranslate, defaultValue = null) {
    let translation = game.i18n.localize(toTranslate)
    if (translation == toTranslate) {
      if (defaultValue === null || defaultValue === undefined) translation = toTranslate;
      return translation;
    } else {
      return translation;
    }
  }

  /**
   * Whether the given module is active
   * 
   * @param {string} id The module id
   * @returns {boolean}
   */
  static isModuleActive(id) {
    const module = game.modules.get(id)
    return module && module.active
  }
}

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
   * TODO
   */
  static getApi() {
    return game.sceneWeather
  }

  /**
   * TODO
   * 
   * @param {*} number 
   * @param {*} min 
   * @param {*} max 
   * @returns 
   */
  static clamp(number, min, max) {
    return Math.min(Math.max(number, min), max)
  }

  /**
   * TODO
   * 
   * @param {*} current 
   * @param {*} inMin 
   * @param {*} inMax 
   * @param {*} outMin 
   * @param {*} outMax 
   * @returns 
   */
  static map(current, inMin, inMax, outMin, outMax) {
    const mapped = ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    return Utils.clamp(mapped, outMin, outMax)
  }

  /**
   * TODO
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

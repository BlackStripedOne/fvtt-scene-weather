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

import { MODULE } from './constants.js'
import { Logger } from './utils.js'

export class FoundryAbstractionLayer {




  /**
   * Get the ID of the current world
   * 
   * @returns {String}
   */
  static get worldId() {
    return game.world.id
  }

  /**
   * Get the ID of the current system
   * 
   * @returns {String}
   */
  static get systemID() {
    return game.system.id
  }

  /**
   * Get the version of the current system
   * 
   * @returns {String}
   */
  static get systemVersion() {
    return game.system.version || game.system.data.version
  }

  /**
   * Returns if the given user is the GM. If no userId is given returns the result for the current user
   * TODO
   * @return {Boolean}
   */
  static isGm(userId = null) {
    const user = (userId ? FoundryAbstractionLayer.getUser(userId) : game.user)
    return user ? user.isGM : false
  }

  /**
   * Returns the current users name
   * 
   * @return {String}
   */
  static userName() {
    const u = game.user
    return u ? u.name ? u.name : '' : ''
  }

  /**
   * TODO
   * 
   * @return {String} Returns the current users ID
   */
  static userID() {
    const u = game.user
    return u ? u.id ? u.id : '' : ''
  }

  /**
   * TODO
   * 
   * @param {String} userId 
   * @returns {User | undefined}
   */
  static getUser(userId) {
    const users = game.users
    if (users) {
      return users.find(u => u.id === userId)
    }
    return undefined
  }

  /**
     * Get controlled tokens
     * 
     * @returns {Array} The controlled tokens
     */
  static getControlledTokens() {
    return game.canvas.tokens.controlled
  }


  /**
   * Get one controlled tokens
   * 
   * @returns {Object} The first controlled token
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
  static getUserByToken(token) {
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
   * Gets the current version of this module
   * 
   * @returns {String}
   */
  static getModuleVersion() {
    const mData = game.modules.get(MODULE.ID)
    if (mData) {
      return mData.version
    }
    return ''
  }

  /**
   * TODO
   * 
   * @returns {Number}
   */
  static getLastTickTime() {
    return canvas.app.ticker.lastTime
  }

  /**
   * TODO
   * 
   * @returns {Number}
   */
  static getWorldTime() {
    return game.time.worldTime
  }

  /**
   * TODO
   * 
   * @param {Number} deltaSeconds 
   * @returns 
   */
  static async advanceWorldTime(deltaSeconds = 0) {
    return game.time.advance(deltaSeconds)
  }

  /**
   * TODO
   * 
   * @param {String} moduleId 
   * @returns {Boolean}
   */
  static isModuleEnabled(moduleId) {
    const module = game.modules.get(moduleId)
    return (module && module.active)
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
   * TODO
   * @param {String} sceneId 
   * @returns {Scene}
   */
  static getScene(sceneId = undefined) {
    return (sceneId) ? game.scenes.get(sceneId) : canvas.scene
  }


  /**
   * Get scene flag value
   * 
   * @param {string} key               The scene flag key
   * @param {string=null} defaultValue The scene flag default value
   * @returns {any}                      The scene flag value or defaultValue, null as fallback
   */
  static getSceneFlag(key, defaultValue = null, sceneId = undefined) {
    let value = defaultValue ?? null
    try {
      value = FoundryAbstractionLayer.getScene(sceneId).getFlag(MODULE.ID, key) ?? defaultValue
    } catch {
      Logger.debug(`SceneFlag '${key}' not found on scene`)
    }
    return value
  }

  /**
   * TODO
   * 
   * @param {String} key 
   * @param {any} value 
   * @param {String} sceneId 
   */
  static async setSceneFlag(key, value, sceneId = undefined) {
    const scene = FoundryAbstractionLayer.getScene(sceneId)
    return scene.setFlag(MODULE.ID, key, value)
  }

  /**
   * TODO
   * 
   * @param {String} key   
   * @param {String} sceneId 
   */
  static async unsetSceneFlag(key, sceneId = undefined) {
    return FoundryAbstractionLayer.getScene(sceneId).unsetFlag(MODULE.ID, key)
  }

  /**
   * Get module user flag
   * 
   * TODO
   * 
   * @param {string} key The flag key
   * @returns {any}        The flag value
   */
  static getUserFlag(key, defaultValue = undefined) {
    let value = defaultValue ?? undefined
    try {
      return game.user.getFlag(MODULE.ID, key)
    } catch {
      console.log(MODULE.NAME + ` Debug | UserFlag '${key}' not found`)
    }
    return value
  }

  /**
   * Set module user flag
   * 
   * @param {string} key The flag key
   * @param {any} value    The flag value
   */
  static async setUserFlag(key, value) {
    await game.user.setFlag(MODULE.ID, key, value)
  }

  /**
   * Unset module user flag
   * 
   * @param {String} key The flag key
   */
  static async unsetUserFlag(key) {
    await game.user.unsetFlag(MODULE.ID, key)
  }

  /**
   * Language translation
   * 
   * @param {String} toTranslate The value to translate
   * @returns {String} The translated value
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
   * TODO
   * 
   * @param {String} id 
   * @returns {Module}
   */
  static getModule(id = MODULE.ID) {
    return game.modules.get(id)
  }

  /**
   * Whether the given module is active
   * 
   * @param {String} id The module id
   * @returns {Boolean}
   */
  static isModuleActive(id) {
    const module = game.modules.get(id)
    return module && module.active
  }


  /**
   * Test whether a value is empty-like; either undefined or a content-less object.
   * @param {*} value       The value to test
   * @returns {boolean}     Is the value empty-like?
   */
  static isEmpty(value) {
    return foundry.utils.isEmpty(value)
  }


}

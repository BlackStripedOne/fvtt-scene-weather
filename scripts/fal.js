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

// FoundryAbstractionLayer
export class FoundryAbstractionLayer {

  /**
   * Checks if a user can do an action based on a passed in permission matrix
   * TODO
   */
  canDo(user = null, permission) {
    if (user === null) return false
    // return !!(user.isGM || (permissions.player && user.hasRole(1)) || (permissions.trustedPlayer && user.hasRole(2)) || (permissions.assistantGameMaster && user.hasRole(3)) || (permissions.users && permissions.users.includes(user.id? user.id : '')))
    return FoundryAbstractionLayer.isGm()
  }

  /**
   * Get the ID of the current world
   */
  static worldId() {
    return game.world.id
  }

  /**
   * Get the ID of the current system
   */
  static systemID() {
    return game.system.id
  }

  /**
   * Get the version of the current system
   */
  static systemVersion() {
    return game.system.version || game.system.data.version
  }

  /**
   * Returns if the given user is the GM. If no userId is given returns the result for the current user
   * TODO
   * @return {boolean}
   */
  static isGm(userId = null) {
    const user = (userId ? FoundryAbstractionLayer.getUser(userId) : game.user)
    return user ? user.isGM : false
  }

  /**
   * Returns the current users name
   * @return {string}
   */
  static userName() {
    const u = game.user
    return u ? u.name ? u.name : '' : ''
  }

  /**
   * Returns the current users ID
   * @return {string}
   */
  static userID() {
    const u = game.user
    return u ? u.id ? u.id : '' : ''
  }

  /**
   * Return : User | undefined
   */
  static getUser(userId) {
    const users = game.users
    if (users) {
      return users.find(u => u.id === userId)
    }
    return undefined
  }

  /**
   * Gets the current version of this module
   */
  static getModuleVersion() {
    const mData = game.modules.get(MODULE.ID)
    if (mData) {
      return mData.version
    }
    return ''
  }

  /**
   * TODO wrapper
   */
  static mergeObject(original, other = {}, options = {}, _d = 0) {
    return foundry.utils.mergeObject(original, other, options, _d)
  }

}

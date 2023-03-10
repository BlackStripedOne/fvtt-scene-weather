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

import { Logger, Utils } from './utils.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { WeatherPerception } from './weatherPerception.js'

/**
 * The Permissions class manages permissions for various features related to weather perception. * 
 * @class
 */
export class Permissions {

  static _permissions = undefined

  /**
   * The default permission structure.
   * @type {object}
   */
  static DEFAULT_PERMISSION_STRUCT = {
    'player': false,
    'trustedPlayer': false,
    'assistantGameMaster': false,
    'users': []
  }

  /**
   * An object that contains empty permissions for all supported features.
   * @type {object}
   */
  static EMPTY_PERMISSIONS = {
    'perciever.scene-weather.vague': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'perciever.scene-weather.icon': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'perciever.scene-weather.perceptive': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'perciever.scene-weather.precise': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'sceneSettings': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'weatherUiControls': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'timeControls': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'meteogramUi': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
  }

  /**
   * The default permissions for all supported features.
   * @type {object}
   */
  static DEFAULT_PERMISSIONS = {
    'perciever.scene-weather.vague': {
      'player': true,
      'trustedPlayer': true,
      'assistantGameMaster': true
    },
    'perciever.scene-weather.icon': {
      'trustedPlayer': true,
      'assistantGameMaster': true
    },
    'perciever.scene-weather.perceptive': {
      'assistantGameMaster': true
    },
    'sceneSettings': Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT),
    'weatherUiControls': {
      'assistantGameMaster': true
    },
    'timeControls': {
      'assistantGameMaster': true
    },
    'meteogramUi': {
      'assistantGameMaster': true
    }
  }

  /**
   * Returns the default permissions for all supported features.
   * @private
   * @returns {object} The default permissions.
   */
  static _getDefaultPermissions() {
    let defaultPermissions = Utils.deepClone(Permissions.DEFAULT_PERMISSIONS)
    Object.keys(WeatherPerception._registeredPercievers).forEach(percieverId => {
      defaultPermissions['perciever.' + percieverId] = Utils.mergeObject(Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT), defaultPermissions['perciever.' + percieverId] || {})
    })
    Logger.debug('Permissions._getDefaultPermissions()', { 'defaultPermissions': defaultPermissions })
    return defaultPermissions
  }

  /**
   * Loads the permissions from the stored settings or returns the default permissions if none are stored.
   * @private
   * @returns {object} The loaded or default permissions.
   */
  static _loadPermissions() {
    const defaultPermissions = Permissions._getDefaultPermissions()
    const storedPermissions = Fal.getSetting('permissions', null)
    if (storedPermissions == null) {
      Logger.debug('Permissions._loadPermissions -> no stored permissions', { 'default': defaultPermissions })
      Permissions._permissions = defaultPermissions
      return Permissions._permissions
    } else {
      const effectivePermissions = Utils.mergeObject(defaultPermissions, storedPermissions, { insertKeys: false, expand: false })
      Logger.debug('Permissions._loadPermissions -> loaded from settings', { 'default': defaultPermissions, 'effective': effectivePermissions, 'stored': storedPermissions })
      Permissions._permissions = effectivePermissions
      return Permissions._permissions
    }
  }

  /**
   * Resets all permissions to their default values. And store those on the game settings.
   * @async
   */
  static async resetPermissions() {
    let emptyPermissions = Utils.deepClone(Permissions.EMPTY_PERMISSIONS)
    Object.keys(WeatherPerception._registeredPercievers).forEach(percieverId => {
      if (!('perciever.' + percieverId in emptyPermissions)) {
        emptyPermissions['perciever.' + percieverId] = Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT)
      }
    })
    Permissions._permissions = Utils.mergeObject(emptyPermissions, Permissions.DEFAULT_PERMISSIONS, { expand: false })
    Fal.setSetting('permissions', Permissions._permissions)
    Logger.debug('Permissions.resetPermissions()', { 'permissions': Permissions._permissions })
  }

  /**
   * Updates the permissions with the given values.
   * @async
   * @param {object} permissions - The permissions to update.
   */
  static async updatePermissions(permissions) {
    Object.keys(WeatherPerception._registeredPercievers).forEach(percieverId => {
      if (!('perciever.' + percieverId in permissions)) {
        permissions['perciever.' + percieverId] = Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT)
      }
    })
    Permissions._permissions = Utils.mergeObject(Utils.deepClone(Permissions.EMPTY_PERMISSIONS), permissions, { expand: false })
    Fal.setSetting('permissions', Permissions._permissions)
    Logger.debug('Permissions.updatePermissions(...)', { 'permissions': Permissions._permissions })
  }

  /**
   * Returns the translated name of the given permission ID.
   * @param {string} [permissionId=undefined] - The permission ID.
   * @returns {string} The translated name.
   */
  static getPermissionNameI18n(permissionId = undefined) {
    if (!permissionId) return Fal.i18n('permissions.unknown.name')
    if (permissionId.startsWith('perciever.')) {
      return Fal.i18n('permissions.percieverName') + WeatherPerception.getInfo(permissionId.replace('perciever.', '')).name
    } else {
      return Fal.i18n('permissions.' + permissionId + '.name')
    }
  }

  /**
   * Returns the translated hint for the given permission ID.
   * @param {string} [permissionId=undefined] - The permission ID.
   * @returns {string} The translated hint.
   */
  static getPermissionHintI18n(permissionId = undefined) {
    if (!permissionId) return Fal.i18n('permissions.unknown.hint') + permissionId
    if (permissionId.startsWith('perciever.')) {
      return Fal.i18n('permissions.percieverHint') + WeatherPerception.getInfo(permissionId.replace('perciever.', '')).name
    } else {
      return Fal.i18n('permissions.' + permissionId + '.hint')
    }
  }

  /**
   * Returns an array of all permission IDs.
   * @returns {string[]} An array of permission IDs.
   */
  static getPermissionIds() {
    if (Permissions._permissions === undefined) Permissions._loadPermissions()
    const permissionIds = Object.keys(Permissions._permissions)
    Logger.debug('Permissions.getPermissionIds()', { 'permissionIds': permissionIds })
    return permissionIds
  }

  /**
   * Returns a permission object for the given permission ID.
   * @param {string} permissionId - The ID of the permission to retrieve.
   * @returns {object} - The permission object for the given ID. If the ID is not found, a deep copy of the default permission structure is returned.
   * @throws {Error} Will throw an error if the permission ID parameter is missing or invalid.
   * @throws {Error} Will throw an error if there is an issue with loading the permissions.
   */
  static getPermissionForId(permissionId) {
    if (!permissionId) return Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT)
    if (Permissions._permissions === undefined) Permissions._loadPermissions()
    if (permissionId in Permissions._permissions) {
      Logger.debug('Permissions.getPermissionForId(...)', { 'permissionId': permissionId, 'permission': Permissions._permissions[permissionId] })
      return Utils.mergeObject(Permissions.DEFAULT_PERMISSION_STRUCT, Permissions._permissions[permissionId], { inplace: false, expand: false })
    } else {
      Logger.debug('Permissions.getPermissionForId(unknown)', { 'permissionId': permissionId })
      return Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT)
    }
  }

  /**
   * Determines if a given user has permission to perform a certain action based on their role. True gamemasters are considered to allways be allowed anything.
   * @param {string} userId - The ID of the user or the role name in ['player', 'trustedPlayer', 'assistantGameMaster'].
   * @param {string} permissionId - The ID of the permission being checked.
   * @param {boolean} [derived=true] - Whether or not to consider derived permissions. Default is true.
   * @returns {boolean} - Returns true if the user has permission to perform the action, false if not.
   * @throws {Error} - Throws an error if either userId or permissionId are null.
   * @example
   *  const hasPermission = Permissions.hasPermission('trustedPlayer', 'perceiver.scene-weather.precise')
   *   // Returns true if users with the role 'trustedPlayer' have permission to see the information provided by the precise perciever of the module scene-weather, false if not.
   */
  static hasPermission(userId = 'player', permissionId = null, derived = true) {
    // No sensible permissions, so deny them
    if (userId === null || permissionId === null) return false
    const permission = Permissions.getPermissionForId(permissionId)
    switch (userId) {
      case 'player':
        return !!(permission.player)
      case 'trustedPlayer':
        return !!(permission.trustedPlayer)
      case 'assistantGameMaster':
        return !!(permission.assistantGameMaster)
      default:
        // GM has all the rights
        if (Fal.isGm(userId) && derived) return true
        const user = Fal.getUser(userId)
        if (!user) return false
        if (permission.player && user.hasRole(1) && derived) return true
        if (permission.trustedPlayer && user.hasRole(2) && derived) return true
        if (permission.assistantGameMaster && user.hasRole(3) && derived) return true
        if (permission.users.includes(userId)) return true
        return false
    }
  }

}

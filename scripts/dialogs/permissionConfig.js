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

import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { Permissions } from '../permissions.js'

export class PermissionConfigDialog extends FormApplication {

  constructor() {
    super()
  }

  /* --------------------- static ----------------------- */

  /** @override */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: 'modules/' + MODULE.ID + '/templates/permissionConfig.hbs',
      id: 'scene-weather-permissions-config',
      title: 'dialogs.permissionConfig.title',
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false,
      width: 220 + (PermissionConfigDialog._getUserIds().length * 110),
      resizable: true
    })
  }

  /**
   * Internal helper to collect all user roles and usernames as structure with localized
   * names, the type and id. For players also their color will be set.
   * @returns {Array(Obejct)} - an array of all usernames and roles as structure.
   */
  static _getUserIds() {
    let userIds = [
      {
        'id': 'player',
        'name': Fal.i18n('USER.RolePlayer'),
        'type': 'role'
      },
      {
        'id': 'trustedPlayer',
        'name': Fal.i18n('USER.RoleTrusted'),
        'type': 'role'
      },
      {
        'id': 'assistantGameMaster',
        'name': Fal.i18n('USER.RoleAssistant'),
        'type': 'role'
      }
    ]
    game.users.forEach(user => {
      userIds.push({
        'id': user._id,
        'name': user.name,
        'type': 'user',
        'color': user.color || '#ffffff'
      })
    })
    return userIds
  }


  /* --------------------- Functions, public ----------------------- */

  /**
   * Activare listeners. Specifically for the reset permission setting button.
   * @param {jQuery} jQ 
   */
  activateListeners(jQ) {
    super.activateListeners(jQ)
    jQ.find("button[name='reset']").click(this._onResetDefaults.bind(this))
  }

  /* --------------------- Functions, private ----------------------- */

  /**
   * Handle button click to reset default settings
   * @param {Event} event   The initial button click event
   * @private
   */
  async _onResetDefaults(event) {
    event.preventDefault()
    await Permissions.resetPermissions()
    Logger.info(Fal.i18n('dialogs.permissionConfig.defaultsNotice'), true)
    return this.render()
  }

  /** @override */
  async _onSubmit(event, options) {
    event.target.querySelectorAll("input[disabled]").forEach(i => i.disabled = false)
    return super._onSubmit(event, options)
  }

  /**
   * Returns the form data to render in the handlebars template
   * @returns {Object} An object containing weather configuration data.
   */
  getData() {
    const userIds = PermissionConfigDialog._getUserIds()

    let additionalData = {
      'headline': userIds,
      matrix: []
    }

    const permissionIds = Permissions.getPermissionIds()
    permissionIds.forEach(permissionId => {
      let userPermissions = []
      userIds.forEach(userId => {
        userPermissions.push({
          'id': userId.id,
          'name': userId.name,
          'check': Permissions.hasPermission(userId.id, permissionId, false),
          'checkId': permissionId + '::' + userId.id
        })
      })
      additionalData.matrix.push({
        'permissionId': permissionId,
        'permissionName': Permissions.getPermissionNameI18n(permissionId),
        'permissionHint': Permissions.getPermissionHintI18n(permissionId),
        'users': userPermissions
      })
    })

    // Sort for consistency
    additionalData.matrix.sort((a, b) => (a.permissionName.localeCompare(b.permissionName)))
    return additionalData
  }

  /**
   * Update the permission settings based on the formData
   * @param {*} event 
   * @param {*} formData 
   */
  _updateObject(event, formData) {
    let permissions = {}
    Object.keys(formData).filter(key => formData[key]).forEach(key => {
      const [permissionId, userId] = key.split('::')
      if (!(permissionId in permissions)) {
        permissions[permissionId] = Utils.deepClone(Permissions.DEFAULT_PERMISSION_STRUCT)
      }
      if (['player', 'trustedPlayer', 'assistantGameMaster'].includes(userId)) {
        permissions[permissionId][userId] = true
      } else {
        permissions[permissionId].users.push(userId)
      }
    })
    Permissions.updatePermissions(permissions)
  }
}

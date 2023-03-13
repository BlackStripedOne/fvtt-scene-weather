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

import { MODULE, EVENTS } from './constants.js'
import { Logger } from './utils.js'
import { RegionConfigDialog } from './regionConfig.js'
import { WeatherConfigDialog } from './weatherConfig.js'
import { PermissionConfigDialog } from './permissionConfig.js'
import { Permissions } from './permissions.js'

function onChangeFunction(value) {
  Hooks.callAll(EVENTS.SETTINGS_UPDATED, value)
}

export const registerSettingsPostInit = function () {
  // TODO
}

export const registerSettingsPreInit = function () {
  game.settings.register(MODULE.ID, 'startup', {
    name: 'One-Time Startup Prompt',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })

  game.settings.registerMenu(MODULE.ID, "permissionSettingsMenu", {
    name: 'settings.permissionSettingsMenu.name',
    label: 'settings.permissionSettingsMenu.label',
    hint: 'settings.permissionSettingsMenu.hint',
    icon: "fa-regular fa-user-lock",
    type: PermissionConfigDialog,
    restricted: true
  })

  game.settings.register(MODULE.ID, 'permissions', {
    scope: 'world',
    config: false, // we will use the menu above to edit this setting
    type: Object,
    default: Permissions._getDefaultPermissions()
  })

  // https://foundryvtt.wiki/en/development/api/settings
  game.settings.registerMenu(MODULE.ID, "defaultRegionSettingsMenu", {
    name: 'settings.defaultRegionSettingsMenu.name',
    label: 'settings.defaultRegionSettingsMenu.label',
    hint: 'settings.defaultRegionSettingsMenu.hint',
    icon: "fas fa-solid fa-sliders",
    type: RegionConfigDialog,
    restricted: true
  })

  game.settings.register(MODULE.ID, 'defaultRegionSettings', {
    scope: 'world',
    config: false, // we will use the menu above to edit this setting
    type: Object,
    default: {
      'elevation': 0,
      'vegetation': 0,
      'waterAmount': 0,
      'summer': {
        'temperature': {
          'max': 0,
          'avg': 0,
          'min': 0,
          'var': 0
        },
        'humidity': {
          'max': 0,
          'avg': 0,
          'min': 0,
          'var': 0
        },
        'wind': {
          'avg': 0,
          'var': 0
        }
      },
      'winter': {
        'temperature': {
          'max': 0,
          'avg': 0,
          'min': 0,
          'var': 0
        },
        'humidity': {
          'max': 0,
          'avg': 0,
          'min': 0,
          'var': 0
        },
        'wind': {
          'avg': 0,
          'var': 0
        }
      }
    }
  })

  game.settings.registerMenu(MODULE.ID, "defaultWeatherSettingsMenu", {
    name: 'settings.defaultWeatherSettingsMenu.name',
    label: 'settings.defaultWeatherSettingsMenu.label',
    hint: 'settings.defaultWeatherSettingsMenu.hint',
    icon: "fas fa-solid fa-sliders",
    type: WeatherConfigDialog,
    restricted: true
  })

  game.settings.register(MODULE.ID, 'defaultWeatherSettings', {
    scope: 'world',
    config: false, // we will use the menu above to edit this setting
    type: Object,
    default: {
      'temp': {
        'ground': 0,
        'air': 0
      },
      'wind': {
        'speed': 0,
        'gusts': 0,
        'direction': 0,
        'directionType': 0
      },
      'clouds': {
        'coverage': 0,
        'bottom': 0,
        'thickness': 0,
        'type': 0
      },
      'precipitation': {
        'amount': 0,
        'type': 0
      },
      'sun': {
        'amount': 0,
      },
      'humidity': 0
    }
  })

  // Add all default values for new scenes...
  // TODO

  game.settings.register(MODULE.ID, 'enableFx', {
    name: 'settings.enableFx.name',
    hint: 'settings.enableFx.hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      onChangeFunction({
        'id': 'enableFx',
        'value': value
      })
    }
  })

  game.settings.register(MODULE.ID, 'cloudsAlpha', {
    name: 'settings.cloudsAlpha.name',
    hint: 'settings.cloudsAlpha.hint',
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 100,
      step: 5
    },
    default: 100,
    onChange: (value) => {
      onChangeFunction({
        'id': 'cloudsAlpha',
        'value': value
      })
    }
  })

  game.settings.register(MODULE.ID, 'precipitationAlpha', {
    name: 'settings.precipitationAlpha.name',
    hint: 'settings.precipitationAlpha.hint',
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 100,
      step: 5
    },
    default: 100,
    onChange: (value) => {
      onChangeFunction({
        'id': 'precipitationAlpha',
        'value': value
      })
    }
  })

  game.settings.register(MODULE.ID, 'maxParticles', {
    name: 'settings.maxParticles.name',
    hint: 'settings.maxParticles.hint',
    scope: 'client',
    config: true,
    type: Number,
    range: {
      min: 200,
      max: 32000,
      step: 200
    },
    default: 3200,
    onChange: (value) => {
      onChangeFunction({
        'id': 'maxParticles',
        'value': value
      })
    }
  })

  game.settings.register(MODULE.ID, 'uiVisible', {
    name: 'settings.uiVisible.name',
    scope: 'client',
    config: false,
    type: Boolean,
    default: false
  })

  game.settings.register(MODULE.ID, 'uiPosition', {
    name: 'settings.uiPosition.name',
    scope: 'client',
    config: false,
    type: Object,
    default: { top: 440, left: 15 }
  })

  game.settings.register(MODULE.ID, 'meteoVisible', {
    name: 'settings.meteoVisible.name',
    scope: 'client',
    config: false,
    type: Boolean,
    default: false
  })

  game.settings.register(MODULE.ID, 'meteoPosition', {
    name: 'settings.meteoPosition.name',
    hint: 'settings.meteoPosition.hint',
    scope: 'client',
    config: false,
    type: Object,
    default: { top: 440, left: 15 }
  })

  game.settings.register(MODULE.ID, 'uiPinned', {
    name: 'settings.uiPinned.name',
    hint: 'settings.uiPinned.hint',
    scope: 'client',
    config: false,
    type: Boolean,
    default: false
  })

  game.settings.register(MODULE.ID, 'loglevel', {
    name: 'settings.loglevel.name',
    hint: 'settings.loglevel.hint',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'info': 'settings.loglevel.info',
      'debug': 'settings.loglevel.debug',
      'trace': 'settings.loglevel.trace'
    },
    default: 'info'
  })

  Logger.debug("Settings Registered");
}

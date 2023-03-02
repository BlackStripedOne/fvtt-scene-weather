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
import { Logger, Utils } from './utils.js'
import { RegionConfigDialog } from './regionConfig.js'
import { WeatherConfigDialog } from './weatherConfig.js'

function onChangeFunction(value) {
  Hooks.callAll(EVENTS.SETTINGS_UPDATED, value)
}

export const registerSettings = function () {
  game.settings.register(MODULE.ID, 'startup', {
    name: 'One-Time Startup Prompt',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })

  // https://foundryvtt.wiki/en/development/api/settings
  game.settings.registerMenu(MODULE.ID, "defaultRegionSettingsMenu", {
    name: Utils.i18n('settings.defaultRegionSettingsMenu.name'),
    label: Utils.i18n('settings.defaultRegionSettingsMenu.label'),
    hint: Utils.i18n('settings.defaultRegionSettingsMenu.hint'),
    icon: "fas fa-bars",
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
    name: Utils.i18n('settings.defaultWeatherSettingsMenu.name'),
    label: Utils.i18n('settings.defaultWeatherSettingsMenu.label'),
    hint: Utils.i18n('settings.defaultWeatherSettingsMenu.hint'),
    icon: "fas fa-bars",
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
    name: Utils.i18n('settings.enableFx.name'),
    hint: Utils.i18n('settings.enableFx.hint'),
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
    name: Utils.i18n('settings.cloudsAlpha.name'),
    hint: Utils.i18n('settings.cloudsAlpha.hint'),
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
    name: Utils.i18n('settings.precipitationAlpha.name'),
    hint: Utils.i18n('settings.precipitationAlpha.hint'),
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
    name: Utils.i18n('settings.maxParticles.name'),
    hint: Utils.i18n('settings.maxParticles.hint'),
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
    name: Utils.i18n('settings.meteoPosition.name'),
    hint: Utils.i18n('settings.meteoPosition.hint'),
    scope: 'client',
    config: false,
    type: Object,
    default: { top: 440, left: 15 }
  })

  game.settings.register(MODULE.ID, 'uiPinned', {
    name: Utils.i18n('settings.uiPinned.name'),
    hint: Utils.i18n('settings.uiPinned.hint'),
    scope: 'client',
    config: false,
    type: Boolean,
    default: false
  })

  game.settings.register(MODULE.ID, 'debug', {
    name: Utils.i18n('settings.debug.name'),
    hint: Utils.i18n('settings.debug.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  })

  Logger.debug("Settings Registered");
}

import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { RegionConfigDialog } from './regionConfig.js'

function onChangeFunction(value) {
  Hooks.callAll(MODULE.LCCNAME + 'SettingsUpdated', value)
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
    name: "Default Region Settings",
    label: "Default Region Settings",      // The text label used in the button
    hint: "A description of what will occur in the submenu dialog.",
    icon: "fas fa-bars",               // A Font Awesome icon used in the submenu button
    type: RegionConfigDialog,   // A FormApplication subclass
    restricted: true                   // Restrict this submenu to gamemaster only?
  });

  game.settings.register(MODULE.ID, 'defaultRegionSettings', {
    scope: 'world',     // "world" = sync to db, "client" = local storage
    config: false,      // we will use the menu above to edit this setting
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
    },        // can be used to set up the default structure
  });

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

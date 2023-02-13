import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { RegionConfigDialog } from './regionConfig.js'

function onChangeFunction(value) {
  if (game[MODULE.LCCNAME]) game[MODULE.LCCNAME].updateSettings()
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

  game.settings.register(MODULE.ID, 'uiVisible', {
    name: Utils.i18n('settings.uiVisible.name'),
    hint: Utils.i18n('settings.uiVisible.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      onChangeFunction(value)
    }
  })

  game.settings.register(MODULE.ID, 'uiPosition', {
    name: Utils.i18n('settings.uiPosition.name'),
    hint: Utils.i18n('settings.uiPosition.hint'),
    scope: 'client',
    config: false,
    type: Object,
    default: { top: 440, left: 15 },
    onChange: (value) => {
      onChangeFunction(value)
    }
  });

  game.settings.register(MODULE.ID, 'uiPinned', {
    name: Utils.i18n('settings.uiPinned.name'),
    hint: Utils.i18n('settings.uiPinned.hint'),
    scope: 'client',
    config: false,
    type: Boolean,
    default: true,
    onChange: (value) => {
      onChangeFunction(value)
    }
  });

  game.settings.register(MODULE.ID, 'debug', {
    name: Utils.i18n('settings.debug.name'),
    hint: Utils.i18n('settings.debug.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      onChangeFunction(value)
    }
  })

  Logger.debug("Settings Registered");
}

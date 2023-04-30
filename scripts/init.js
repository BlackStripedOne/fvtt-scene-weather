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

import { MODULE, EVENTS, GENERATOR_MODES } from './constants.js'
import { Logger } from './utils.js'
import { registerSettingsPreInit, registerSettingsPostInit } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { getSceneWeatherAPIv1 } from './api.js'
import { WeatherTab } from './ui/weatherTab.js'
import { WeatherUi } from './ui/weatherUi.js'
import { MeteoUi } from './ui/meteoUi.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { MacroConfigDialog } from './macros/macroConfig.js'

/*
  Module Emitters:
  - Initialized:          Once the module is fully Initialized
  - RegisterGenerators:   When the module wants plug-ins to register their ParticleEmitter generators to the api
  - RegisterFilters:      When the module wants plug-ins to register their Filter generators to the api
  - WeatherUpdated:       When the weather data was changed
*/

/**
 * Invoked once when foundry is loaded upon the browser
 */
Hooks.once('init', () => {
  // Set current module version from manifest
  MODULE.VERSION = game.modules.get('scene-weather')?.version ?? 'development'

  registerSettingsPreInit()
  Logger.debug('->Hook:init') // debug is available only after registering settings
  registerHbHelpers()
  loadHandlebars()

  // Registering api
  window.SceneWeather = getSceneWeatherAPIv1()
  Logger.info('API registered at global symbol SceneWeather')

  // TODO maybe use Hools.emit instead ?

  // Pass the Scene Controls to a hook function to allow overrides or changes
  /**
   * A hook event that fires when the Scene controls are initialized.
   * @function getSceneControlButtons
   * @memberof hookEvents
   * @param {SceneControl[]} controls The SceneControl configurations
   */
  Hooks.callAll(EVENTS.REG_FX_GENERATORS)

  Hooks.callAll(EVENTS.REG_FX_FILTERS)
  Hooks.callAll(EVENTS.REG_TEMPLATE_REGION)
  Hooks.callAll(EVENTS.REG_TEMPLATE_WEATHER)
  Hooks.callAll(EVENTS.REG_WEATHER_PERCIEVERS)
  registerSettingsPostInit()
  Logger.debug('Initialized')
  Hooks.callAll(EVENTS.MODULE_INITIALIZED)
})

Hooks.on(MODULE.LCCNAME + 'Initialized', async () => {
  Logger.trace('->Hook:' + MODULE.LCCNAME + 'Initialized')

  Hooks.on('updateScene', async (scene, deltaData, options, id) => {
    if (deltaData['flags'] !== undefined && deltaData.flags[MODULE.ID] !== undefined) {
      if ('nodes' in deltaData.flags[MODULE.ID] || '-=nodes' in deltaData.flags[MODULE.ID]) {
        Logger.trace('updateScene-> weatherNodes updates Call updateWeatherMask')
        await canvas.sceneweatherfx.updateWeatherMask()
        return
      }

      Logger.trace('updateScene-> ', { deltaData: deltaData, options: options })
      SceneWeather.updateWeatherConfig({
        forSceneId: deltaData._id,
        force: true
      })
      if (deltaData.flags[MODULE.ID]['weatherMode'] == GENERATOR_MODES.DISABLED) {
        // TODO use EVENTS
        Logger.trace('updateScene-> Disabled SceneWeather...', { scene: scene, sceneId: id })
        Hooks.callAll(MODULE.LCCNAME + 'WeatherDisabled', { scene: scene, sceneId: id })
      }
      if (
        deltaData.flags[MODULE.ID]['weatherMode'] !== undefined ||
        deltaData.flags[MODULE.ID]['timeProvider'] !== undefined
      ) {
        // redraw potentially changed button sidebar
        // Re-render Scene controls
        // TODO if ( ui.controls ) ui.controls.initialize({layer: this.constructor.layerOptions.name, tool});
        ui.controls.initialize()
        // redraw changes to macro config dialog
        MacroConfigDialog.refresh()
        // redraw changes to weatherUI
        WeatherUi.toggleAppVis('initial')
      }
    }
  })

  Hooks.on('renderSceneConfig', async (app, jQ, data) => {
    Logger.trace('renderSceneConfig', { app: app, jQ: jQ, data: data })
    WeatherTab.addControlsTab(app, jQ)
  })
})

/**
 * Called after Init
 */
Hooks.once('setup', () => {
  Logger.trace('->Hook:setup')
  //WeatherLayer.registerLayers()
  //WeatherLayer.registerLayerButtons()

  // Register SceneWeather Effect
  // in case we want to add our effect to the basic effects. Currently, we don't.
  // foundry.utils.mergeObject(CONFIG.weatherEffects, {sceneweather: WeatherEffect})
})

// Called when new canvas/scene is loaded
Hooks.on('canvasReady', async (canvasData) => {
  Logger.trace('->Hook:canvasReady(...)', { canvas: canvasData })

  WeatherUi.toggleAppVis('initial')
  if (Fal.getSetting('uiPinned', false)) {
    WeatherUi.pinApp()
  }

  MeteoUi.toggleAppVis('initial')

  MacroConfigDialog.refresh()

  SceneWeather.updateWeather({ force: true })
})

/**
 * Only called once. Everything is set up
 */
Hooks.on('ready', async () => {
  // TODO check if all elements are properly loaded and registered
  Hooks.callAll(EVENTS.MODULE_READY)
  Logger.info('Ready')
})

/**
 * TODO
 */
Hooks.on(EVENTS.MODULE_READY, async () => {
  Logger.trace('->Hook:' + MODULE.LCCNAME + 'Ready')
})

/**
 * TODO
 * A hook event that fires when the World time has been updated.
 *
 * @param {number} worldTime - The new canonical World time
 * @param {number} delta - The time delta
 * @param {any} options - Options passed from the requesting client which triggered the update
 * @param {string} userId - The ID of the User who changed the world time
 */
Hooks.on('updateWorldTime', (worldTime, delta, options, userId) => {
  Logger.trace('->Hook:updateWorldTime', {
    worldTime: worldTime,
    delta: delta,
    options: options,
    userId: userId
  })
  if (
    [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(
      Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)
    )
  ) {
    // Only update dynamic weathers
    SceneWeather.updateWeather()
  }
})

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

import { MODULE, EVENTS, GENERATOR_MODES } from './constants.js'
import { Logger } from './utils.js'
import { registerSettingsPreInit, registerSettingsPostInit } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { getSceneWeatherAPIv1 } from './api.js'
import { WeatherLayer } from './weatherLayer.js'
import { WeatherTab } from './weatherTab.js'
import { WeatherUi } from './weatherUi.js'
import { MeteoUi } from './meteoUi.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'

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
Hooks.once("init", () => {
  registerSettingsPreInit()
  Logger.debug('->Hook:init')  // debug is available only after registering settings
  registerHbHelpers()
  loadHandlebars()

  // Registering api
  window.SceneWeather = getSceneWeatherAPIv1()
  Logger.info('API registered at global symbol SceneWeather')

  // TODO maybe use Hools.emit instead ?
  Hooks.callAll(EVENTS.REG_FX_GENERATORS)
  Hooks.callAll(EVENTS.REG_FX_FILTERS)
  Hooks.callAll(EVENTS.REG_TEMPLATE_REGION)
  Hooks.callAll(EVENTS.REG_TEMPLATE_WEATHER)
  Hooks.callAll(EVENTS.REG_WEATHER_PERCIEVERS)
  registerSettingsPostInit()
  Logger.debug("Initialized")
  Hooks.callAll(EVENTS.MODULE_INITIALIZED)
})

Hooks.on(MODULE.LCCNAME + 'Initialized', async () => {
  Logger.debug('->Hook:' + MODULE.LCCNAME + 'Initialized')


  Hooks.on('updateScene', async (scene, deltaData, options, id) => {
    if (deltaData['flags'] !== undefined && deltaData.flags[MODULE.ID] !== undefined) {
      Logger.debug('updateScene-> ', { 'deltaData': deltaData, 'options': options })
      SceneWeather.updateWeatherConfig({
        forSceneId: deltaData._id,
        force: true
      })
      if (deltaData.flags[MODULE.ID]['weatherMode'] == GENERATOR_MODES.DISABLED) {
        // TODO use EVENTS
        Logger.debug('updateScene-> Disabled SceneWeather...', { 'scene': scene, 'sceneId': id })
        Hooks.callAll(MODULE.LCCNAME + 'WeatherDisabled', { 'scene': scene, 'sceneId': id })
      }
      if (deltaData.flags[MODULE.ID]['weatherMode'] !== undefined) {
        Logger.debug('updateScene-> WeatherUi needs update...')
        WeatherUi.toggleAppVis('initial')
      }
    }
  })

  Hooks.on("renderSceneConfig", async (app, jQ, data) => {
    Logger.debug('renderSceneConfig', { 'app': app, 'jQ': jQ, 'data': data })
    WeatherTab.addControlsTab(app, jQ)
  })
})

/**
 * Called after Init
 */
Hooks.once('setup', () => {
  Logger.debug('->Hook:setup')
  WeatherLayer.registerLayers()
  WeatherLayer.registerLayerButtons()

  // Register SceneWeather Effect  
  // in case we want to add our effect to the basic effects. Currently, we don't.
  // foundry.utils.mergeObject(CONFIG.weatherEffects, {sceneweather: WeatherEffect})
})

// Called when new canvas/scene is loaded
Hooks.on('canvasReady', async (canvasData) => {
  Logger.debug('->Hook:canvasReady(...)', { 'canvas': canvasData })

  WeatherUi.toggleAppVis('initial')
  if (Fal.getSetting('uiPinned', false)) {
    WeatherUi.pinApp();
  }

  MeteoUi.toggleAppVis('initial')

  SceneWeather.updateWeather({ force: true })
})

/**
 * Only called once. Everything is set up
 */
Hooks.on('ready', async () => {
  // TODO

  Hooks.callAll(MODULE.LCCNAME + 'Ready')
  Logger.info("Ready")
})

/**
 * TODO
 */
Hooks.on(MODULE.LCCNAME + 'Ready', async () => {
  Logger.debug('->Hook:' + MODULE.LCCNAME + 'Ready')
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
  Logger.debug('->Hook:updateWorldTime', { 'worldTime': worldTime, 'delta': delta, 'options': options, 'userId': userId })
  if ([GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))) {
    // Only update dynamic weathers
    SceneWeather.updateWeather()
  }
})

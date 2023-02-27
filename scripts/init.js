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
import { Logger, Utils } from './utils.js'
import { registerSettings } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { SceneWeatherApi } from './api.js'
import { WeatherLayer } from './weatherLayer.js'
import { WeatherTab } from './weatherTab.js'
import { WeatherUi } from './weatherUi.js'
import { MeteoUi } from './meteoUi.js'

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
  registerSettings()
  Logger.debug('->Hook:init')  // debug is available only after registering settings
  registerHbHelpers()
  loadHandlebars()
  SceneWeatherApi.registerApi()
  Hooks.callAll(MODULE.LCCNAME + 'RegisterGenerators')
  Hooks.callAll(MODULE.LCCNAME + 'RegisterFilters')
  Hooks.callAll(MODULE.LCCNAME + 'RegisterRegionTemplate')
  Hooks.callAll(MODULE.LCCNAME + 'RegisterWeatherTemplate')
  Logger.debug("Init Done", { 'api': game.sceneWeather })
  Hooks.callAll(MODULE.LCCNAME + 'Initialized')
})

Hooks.on(MODULE.LCCNAME + 'Initialized', async () => {
  Logger.debug('->Hook:' + MODULE.LCCNAME + 'Initialized')

  Hooks.on('updateScene', async (scene, deltaData, options, id) => {
    if (deltaData['flags'] !== undefined && deltaData.flags[MODULE.ID] !== undefined) {
      Logger.debug('updateScene-> ', { 'deltaData': deltaData, 'options': options })
      SceneWeatherApi.updateWeatherConfig({
        forSceneId: deltaData._id,
        force: true
      })
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
  if (game.settings.get(MODULE.ID, 'uiPinned')) {
    WeatherUi.pinApp();
  }

  MeteoUi.toggleAppVis('initial')

  SceneWeatherApi.calculateWeather({ force: true })
})

/**
 * Only called once. Everything is set up
 */
Hooks.on('ready', async () => {
  // TODO
  Hooks.callAll(MODULE.LCCNAME + 'Ready')
  Logger.info("Ready")
})

Hooks.on(MODULE.LCCNAME + 'Ready', async () => {
  Logger.debug('->Hook:' + MODULE.LCCNAME + 'Ready')
})

/**
 * A hook event that fires when the World time has been updated.

Parameters
worldTime: number
The new canonical World time

delta: number
The time delta

options: any
Options passed from the requesting client which triggered the update

userId: string
The ID of the User who changed the world time
 */
Hooks.on('updateWorldTime', (worldTime, delta, options, userId) => {
  Logger.debug('->Hook:updateWorldTime', { 'worldTime': worldTime, 'delta': delta, 'options': options, 'userId': userId })
  if (['regionTemplate', 'regionAuto'].includes(Utils.getSceneFlag('weatherMode', 'disabled'))) {
    // Only update dynamic weathers
    SceneWeatherApi.calculateWeather()
  }

})

/*
// Handle toggling of time separator flash when game is paused/unpaused.
Hooks.on('pauseGame', () => {
  Logger.debug('->Hook:pauseGame')
  SceneWeatherApi.calculateWeather()
})
*/

/*
// Listen for changes to the realtime clock state.
Hooks.on('simple-calendar-clock-start-stop', () => {
  Logger.debug('->Hook:simple-calendar-clock-start-stop')
  SceneWeatherApi.calculateWeather()
})
*/

/*
Hooks.on('simple-calendar-date-time-change', (data) => {
  // Handled via updateWorldTime hook
})
*/


/*
Hooks.on('renderMeteoUi', () => {
  Logger.debug('Hook:renderMeteoUi')
})
*/

/*
Hooks.on('deactivateSpecialEffectsLayer', (layer) => {
  Logger.debug('deactivateSpecialEffectsLayer  ->', layer)
})
*/





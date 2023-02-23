import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { registerSettings } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { SceneWeatherApi } from './api.js'
import { WeatherMenu } from './weatherMenu.js'
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

Hooks.on('ready', async () => {
  // TODO
  Hooks.callAll(MODULE.LCCNAME + 'Initialized')
  Logger.info("Ready")
})

Hooks.once('setup', () => {
  WeatherMenu.registerButtons()

  // Register SceneWeather Effect  
  // in case we want to add our effect to the basic effects. Currently, we don't.
  // foundry.utils.mergeObject(CONFIG.weatherEffects, {sceneweather: WeatherEffect})

})

// Wait for the app to be rendered, then adjust the CSS to
// account for the date display, if showing.

Hooks.on('renderMeteoUi', () => {
  Logger.debug('Hook:renderMeteoUi')
})

Hooks.on('deactivateSpecialEffectsLayer', (layer) => {
  Logger.debug('deactivateSpecialEffectsLayer  ->', layer)

})

Hooks.once("init", () => {
  registerSettings()
  registerHbHelpers()
  loadHandlebars()
  SceneWeatherApi.registerApi()
  Hooks.callAll(MODULE.LCCNAME + 'RegisterGenerators')
  Hooks.callAll(MODULE.LCCNAME + 'RegisterFilters')
  Logger.debug("Init Done", { 'api': game.sceneWeather })
})

// Called when new canvas/scene is loaded
Hooks.on('canvasReady', (canvasData) => {
  Logger.debug('Hook:canvasInit()', { 'canvas': canvasData })
  SceneWeatherApi.calculateWeather({ force: true })
})

// Listen for changes to the worldTime from elsewhere.
Hooks.on('updateWorldTime', () => {
  Logger.debug('Hook:updateWorldTime()')
  SceneWeatherApi.calculateWeather()
})

// Handle toggling of time separator flash when game is paused/unpaused.
Hooks.on('pauseGame', () => {
  SceneWeatherApi.calculateWeather()
})

// Listen for changes to the realtime clock state.
Hooks.on('simple-calendar-clock-start-stop', () => {
  SceneWeatherApi.calculateWeather()
})

Hooks.on('simple-calendar-date-time-change', (data) => {
  // Handled via updateWorldTime hook
})

Hooks.on('canvasReady', async () => {
  Hooks.on(MODULE.LCCNAME + 'Initialized', async () => {

    Hooks.on('updateScene', async (scene, deltaData, options, id) => {
      if (deltaData['flags'] !== undefined && deltaData.flags[MODULE.ID] !== undefined) {
        Logger.debug('updateScene-> ', { 'deltaData': deltaData, 'options': options })
        SceneWeatherApi.updateWeatherConfig({
          forSceneId: deltaData._id,
          force: true
        })
      }
    })

  })

  WeatherUi.toggleAppVis('initial')
  if (game.settings.get(MODULE.ID, 'uiPinned')) {
    WeatherUi.pinApp();
  }

  MeteoUi.toggleAppVis('initial')

})

Hooks.on("renderSceneConfig", async (app, jQ, data) => {
  Logger.debug('renderSceneConfig', { 'app': app, 'jQ': jQ, 'data': data })
  WeatherTab.addControlsTab(app, jQ)
});

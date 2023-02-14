import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { registerSettings } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { SceneWeatherApi } from './api.js'
import { WeatherMenu } from './weatherMenu.js'
import { WeatherTab } from './weatherTab.js'
import { WeatherUi } from './weatherUi.js'

Hooks.on('ready', async () => {
  // TODO
  Hooks.callAll(MODULE.LCCNAME + 'Initialized')
  Logger.info("Ready")
})

Hooks.once('setup', () => {
  WeatherMenu.registerButtons()
})

// Wait for the app to be rendered, then adjust the CSS to
// account for the date display, if showing.
Hooks.on('renderWeatherUi', () => {
  Logger.debug('Hook:renderWeatherUi')

  game.sceneWeather.debugChart = undefined // DEBUG only

  SceneWeatherApi.updateWeather()
})

Hooks.once("init", () => {
  registerSettings()
  registerHbHelpers()
  loadHandlebars()
  SceneWeatherApi.registerApi()
  Logger.debug("Init Done")
})

// Listen for changes to the worldTime from elsewhere.
Hooks.on('updateWorldTime', () => {
  SceneWeatherApi.updateWeather()
})

// Handle toggling of time separator flash when game is paused/unpaused.
Hooks.on('pauseGame', () => {
  SceneWeatherApi.updateWeather()
})

// Listen for changes to the realtime clock state.
Hooks.on('simple-calendar-clock-start-stop', () => {
  SceneWeatherApi.updateWeather()
})

Hooks.on('simple-calendar-date-time-change', (data) => {
  SceneWeatherApi.updateWeather()
})

Hooks.on('canvasReady', async () => {
  Hooks.on(MODULE.LCCNAME + 'Initialized', async () => {

    // Registers hooks
    // TODO

    Hooks.on('preUpdateScene', async (scene, deltaData, options, id) => {
      if (deltaData['flags'] !== undefined && deltaData.flags[MODULE.ID] != undefined) {
        Logger.debug('preUpdateScene-> ', { 'deltaData': deltaData, 'options': options })
        SceneWeatherApi.updateWeather(deltaData._id, true)
      }
    })

    Hooks.on('updateScene', async (scene, deltaData, options, id) => {
      if (deltaData['flags'] !== undefined && deltaData.flags[MODULE.ID] != undefined) {
        Logger.debug('preUpdateScene-> ', { 'deltaData': deltaData, 'options': options })
        SceneWeatherApi.updateWeather(deltaData._id, true)
      }
    })

  })

  WeatherUi.toggleAppVis('initial')
  if (game.settings.get(MODULE.ID, 'uiPinned')) {
    WeatherUi.pinApp();
  }

})

Hooks.on("renderSceneConfig", async (app, jQ, data) => {
  Logger.debug('renderSceneConfig', { 'app': app, 'jQ': jQ, 'data': data })
  WeatherTab.addControlsTab(app, jQ)
});

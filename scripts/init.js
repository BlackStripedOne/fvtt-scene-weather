import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { registerSettings } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { SceneWeatherApi } from './api.js'
import { WeatherMenu } from './weatherMenu.js'
import { WeatherTab } from './weatherTab.js'
import { WeatherUi } from './weatherUi.js'
import { MeteoUi } from './meteoUi.js'

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
  SceneWeatherApi.updateWeather()
})

Hooks.on('renderMeteoUi', () => {
  Logger.debug('Hook:renderMeteoUi')
  //  MeteoUi._chart = undefined // TODO handle more nicely
  SceneWeatherApi.updateWeather()
})

// FIX ?
Hooks.on('tearDownWeatherEffectsLayer', (layer) => {
  Logger.debug('tearDownWeatherEffectsLayer->', layer)
  canvas.sceneweatherfx._tearDown()
  // canvas.sceneweatherfx.tearDown()
})
// END FIX ?

Hooks.once("init", () => {
  registerSettings()
  registerHbHelpers()
  loadHandlebars()
  SceneWeatherApi.registerApi()
  Hooks.callAll(MODULE.LCCNAME + 'RegisterGenerators')
  Logger.debug("Init Done", { 'api': game.sceneWeather })
})

// Listen for changes to the worldTime from elsewhere.
Hooks.on('updateWorldTime', () => {
  SceneWeatherApi.updateWeather()
  canvas.sceneweatherfx._tearDown() // potential fix? The issue is when drawParticleEffects is called WITHOUT prior _tearDown
  canvas.sceneweatherfx.drawParticleEffects()
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
  canvas.sceneweatherfx._tearDown() // potential fix?
  canvas.sceneweatherfx.drawParticleEffects()
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

  MeteoUi.toggleAppVis('initial')

})

Hooks.on("renderSceneConfig", async (app, jQ, data) => {
  Logger.debug('renderSceneConfig', { 'app': app, 'jQ': jQ, 'data': data })
  WeatherTab.addControlsTab(app, jQ)
});

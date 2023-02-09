import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { registerSettings } from './settings.js'
import { registerHbHelpers, loadHandlebars } from './hbHelpers.js'
import { SceneWeatherApi } from './api.js'
import { WeatherMenu } from './weatherMenu.js'
import { WeatherTab } from './weatherTab.js'

Hooks.on('ready', async () => {
  // TODO
  Hooks.callAll(MODULE.LCCNAME + 'Initialized')
  Logger.info("Ready")
})

Hooks.once('setup', () => {
  WeatherMenu.registerButtons()
})

Hooks.once("init", () => {
  registerSettings()
  registerHbHelpers()
  loadHandlebars()
  SceneWeatherApi.registerApi()
  Logger.debug("Init Done")
});


Hooks.on('canvasReady', async () => {
  Hooks.on(MODULE.LCCNAME + 'Initialized', async () => {

    // Registers hooks
    // TODO

  })
})

Hooks.on("renderSceneConfig", async (app, jQ, data) => {
  Logger.debug('renderSceneConfig', { 'app': app, 'jQ': jQ, 'data': data })
  WeatherTab.addControlsTab(app, jQ)
});

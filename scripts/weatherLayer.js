import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { WeatherUi } from './weatherUi.js'
import { MeteoUi } from './meteoUi.js'
import { WeatherEffectsLayer } from './weatherFxLayer.js'

/**
 * Layer for the scene-weather. FEATURE placeable sources and sinks on this layer
 */
export class WeatherLayer extends InteractionLayer {

  static registerLayers() {
    // add weather layer
    CONFIG.Canvas.layers.sceneweather = {
      layerClass: WeatherLayer,
      group: "interface"
    }
    CONFIG.Canvas.layers.sceneweatherfx = {
      layerClass: WeatherEffectsLayer,
      group: "primary"
    }
  }

  /**
   * Register the buttons for the layer relevant menu on the sidebar
   */
  static registerLayerButtons() {

    Hooks.on("getSceneControlButtons", btns => {
      const weatherOptions = [{
        name: "Toggle Weather UI",
        title: 'Toggle Weather UI',
        icon: "fas fa-solid fa-window-maximize",
        visible: game.user.isGM,
        toggle: true,
        active: WeatherUi._isOpen,
        onClick: () => {
          WeatherUi.toggleAppVis('toggle');
        }
      },
      {
        name: "Toggle Meteogram",
        title: 'Toggle Meteogram',
        icon: "fas fa-solid fa-chart-line",
        visible: game.user.isGM && ['regionTemplate', 'regionAuto'].includes(Utils.getSceneFlag('weatherMode', 'disabled')),
        toggle: true,
        active: MeteoUi._isOpen,
        onClick: () => {
          MeteoUi.toggleAppVis('toggle');
        }
      },
      {
        name: "Weather Effects Enabled",
        title: 'Weather Effects Enabled',
        icon: "fas fa-solid fa-eye",
        toggle: true,
        active: Utils.getSetting('enableFx', true),
        onClick: () => {
          // Toggle FX Enabled
          const enabled = (!Utils.getSetting('enableFx', true))
          Utils.setSetting('enableFx', enabled)
          Hooks.callAll(MODULE.LCCNAME + 'SettingsUpdated', {
            'id': 'enableFx',
            'value': enabled
          })
        }
      },
      {
        name: "Some Button",
        title: 'Some Button',
        icon: "fas fa-solid fa-square-xmark",
        button: true,
        onClick: () => {
          //TODO
        }
      }
      ]

      btns.splice(btns.findIndex(e => e.name === 'sounds') + 1, 0, {
        name: "Scene Weather",
        title: "Scene Weather",
        icon: "fas fa-solid fa-cloud-bolt-sun",
        layer: "sceneweather",
        // activeTool: 'name_of_tool_to_automatically_select
        tools: weatherOptions
      })
    })

  }

  static get layerOptions() {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: "sceneweather",
      canDragCreate: false,
      controllableObjects: true,
      rotatableObjects: true,
      zIndex: 666,
    });
  }

  selectObjects(optns) {
    canvas.tokens.selectObjects(optns)
  }
}

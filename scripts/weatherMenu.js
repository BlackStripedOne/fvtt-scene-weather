import { Logger, Utils } from './utils.js'
import { WeatherUi } from './weatherUi.js'
import { MeteoUi } from './meteoUi.js'
import { WeatherEffectsLayer } from './weatherFxLayer.js'
/**
 * Menu class for the weather layer
 */
export class WeatherMenu {

  /**
   * Register the buttons for the layer relevant menu on the sidebar
   */
  static registerButtons() {

    // add weather layer
    CONFIG.Canvas.layers.sceneweather = {
      layerClass: WeatherLayer,
      group: "interface"
    }
    CONFIG.Canvas.layers.sceneweatherfx = {
      layerClass: WeatherEffectsLayer,
      group: "primary"
    }

    Hooks.on("getSceneControlButtons", btns => {
      const weatherOptions = [{
        name: "Toggle Weather UI",
        title: 'Toggle Weather UI',
        icon: "fas fa-solid fa-eye",
        visible: game.user.isGM,
        toggle: true,
        active: WeatherUi._isOpen,
        onClick: () => {
          WeatherUi.toggleAppVis('toggle');
        }
      },
      {
        name: "Update clients",
        title: 'Update clients',
        icon: "fas fa-solid fa-arrows-rotate",
        button: true,
        onClick: () => {
          MeteoUi.toggleAppVis('toggle');
        }
      },
      {
        name: "Remove All Weather",
        title: 'Remove All Weather',
        icon: "fas fa-solid fa-trash",
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
}

/**
 * Layer for the scene-weather. FEATURE placeable sources and sinks on this layer
 */
class WeatherLayer extends InteractionLayer {

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

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

import { MODULE, GENERATOR_MODES } from './constants.js'
import { Utils } from './utils.js'
import { WeatherUi } from './weatherUi.js'
import { MeteoUi } from './meteoUi.js'
import { WeatherEffectsLayer } from './weatherFxLayer.js'
import { RegionConfigDialog } from './regionConfig.js'
import { WeatherConfigDialog } from './weatherConfig.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'

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
        name: 'dialogs.weatherUi.toggleName',
        title: 'dialogs.weatherUi.toggleTitle',
        icon: "fas fa-solid fa-window-maximize",
        visible: true, // TODO use rights management here.
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
        visible: Fal.isGm() && [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)),  // TODO use Fal and rights management here
        toggle: true,
        active: MeteoUi._isOpen,
        onClick: () => {
          MeteoUi.toggleAppVis('toggle');
        }
      },
      {
        name: "Weather Settings",
        title: 'Weather Settings',
        icon: "fas fa-solid fa-sliders",
        visible: Fal.isGm() && [GENERATOR_MODES.WEATHER_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)), // TODO use Fal and rights management here
        button: true,
        onClick: () => {
          if (Fal.isGm() && [GENERATOR_MODES.WEATHER_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))) {
            const dia = new WeatherConfigDialog(canvas.scene._id)
            dia.render(true)
          }
        }
      },
      {
        name: "Region Settings",
        title: 'Region Settings',
        icon: "fas fa-solid fa-sliders",
        visible: Fal.isGm() && [GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)), // TODO use Fal and rights management here
        button: true,
        onClick: () => {
          if (Fal.isGm() && [GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))) {
            const dia = new RegionConfigDialog(canvas.scene._id)
            dia.render(true)
          }
        }
      },
      {
        name: "Weather Effects Enabled",
        title: 'Weather Effects Enabled',
        icon: "fas fa-solid fa-eye",
        visible: true,
        toggle: true,
        active: Fal.getSetting('enableFx', true),
        onClick: () => {
          // Toggle FX Enabled
          const enabled = (!Fal.getSetting('enableFx', true))
          Fal.setSetting('enableFx', enabled)
          Hooks.callAll(MODULE.LCCNAME + 'SettingsUpdated', {
            'id': 'enableFx',
            'value': enabled
          })
        }
      }]

      btns.splice(btns.findIndex(e => e.name === 'sounds') + 1, 0, {
        name: "Scene Weather",  // TODO localize
        title: "Scene Weather",
        icon: "fas fa-solid fa-cloud-bolt-sun",
        layer: "sceneweather",
        // activeTool: 'name_of_tool_to_automatically_select
        tools: weatherOptions
      })
    })

  }

  static get layerOptions() {
    return Utils.mergeObject(super.layerOptions, {
      name: "sceneweather",
      canDragCreate: false,
      controllableObjects: true,
      rotatableObjects: true,
      zIndex: 479,
    });
  }

  selectObjects(optns) {
    canvas.tokens.selectObjects(optns)
  }
}

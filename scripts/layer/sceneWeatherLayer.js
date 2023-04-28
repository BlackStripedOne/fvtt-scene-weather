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

import { MODULE, GENERATOR_MODES, CREATION_STATES, EVENTS, NODE_TYPE } from '../constants.js'
import { Logger, Utils } from '../utils.js'
import { WeatherUi } from '../weatherUi.js'
import { MeteoUi } from '../meteoUi.js'
import { WeatherEffectsLayer } from '../weatherFxLayer.js'
import { RegionConfigDialog } from '../regionConfig.js'
import { WeatherConfigDialog } from '../weatherConfig.js'
import { MacroConfigDialog } from '../macros/macroConfig.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { WeatherPerception } from '../weatherPerception.js'
import { Permissions } from '../permissions.js'
import { WeatherNodeData } from './weatherNodeData.js'
import { WeatherNodeHud } from './weatherNodeHud.js'
import { NodeFrame } from './nodeFrame.js'
import { MaskWeatherNode } from './maskWeatherNode.js'
import { EmitterWeatherNode } from './emitterWeatherNode.js'

Hooks.on(EVENTS.MODULE_READY, () => {
  Hooks.on("renderSceneControls", (controls, html) => {
    if (controls.activeControl == 'sceneweather') {
      const nodeBtn = $('li[data-tool="weatherNode"]', html)
      const activeTool = game.activeTool
      let nodeTypes = $('<ol>').addClass('control-tools').appendTo($('<div>').attr('id', 'node-types').appendTo(nodeBtn))
      for (let type of Object.keys(SceneWeatherLayer.nodeTypes)) {
        $('li[data-tool="' + type + '"]', html).appendTo(nodeTypes)
        if (activeTool == 'weatherNode') $('li[data-tool="' + type + '"]', html).toggleClass('active', type === canvas.sceneweather.selectedTool)
      }
      //const sceneWeatherControl = controls.controls.find(e => e.name == 'sceneweather')
      nodeBtn.toggleClass('active', Object.keys(SceneWeatherLayer.nodeTypes).includes(controls.activeTool) || controls.activeTool == 'weatherNode')
      nodeBtn.attr('data-tooltip', 'layer.controls.' + canvas.sceneweather.selectedTool)
      nodeBtn.children('i').first().attr('class', SceneWeatherLayer.nodeTypes[canvas.sceneweather.selectedTool].icon)
      const pos = nodeBtn.position()
      nodeTypes.parent().css({ top: pos.top, left: pos.left + nodeBtn.width() })
    } else {
      $('#node-types').remove()
    }
  })
})

Hooks.once('setup', () => {
  Logger.trace('->Hook:setup')

  // add weather layer
  CONFIG.Canvas.layers.sceneweatherfx = {
    layerClass: WeatherEffectsLayer,
    group: "primary"
  }
  CONFIG.Canvas.layers.sceneweather = {
    layerClass: SceneWeatherLayer,
    group: "primary"
  }

  // register layer controls
  Hooks.on("getSceneControlButtons", btns => {
    const userId = Fal.userID()
    const weatherOptions = [
      {
        name: 'dialogs.weatherUi.toggleName',
        title: 'dialogs.weatherUi.toggleTitle',
        icon: 'fas fa-solid fa-window-maximize',
        visible: (WeatherPerception.getAllowedIds(userId).length >= 1) && (Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED) != GENERATOR_MODES.DISABLED),
        toggle: true,
        active: WeatherUi._isOpen,
        onClick: () => {
          WeatherUi.toggleAppVis('toggle')
        }
      },
      {
        name: 'dialogs.meteoUi.toggleName',
        title: 'dialogs.meteoUi.toggleTitle',
        icon: 'fas fa-solid fa-chart-line',
        visible: Permissions.hasPermission(userId, 'meteogramUi') && [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)),
        toggle: true,
        active: MeteoUi._isOpen,
        onClick: () => {
          MeteoUi.toggleAppVis('toggle')
        }
      },
      {
        name: 'dialogs.weatherConfig.toggleName',
        title: 'dialogs.weatherConfig.toggleTitle',
        icon: 'fas fa-solid fa-sliders',
        visible: Permissions.hasPermission(userId, 'sceneSettings') && [GENERATOR_MODES.WEATHER_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)),
        button: true,
        onClick: () => {
          if (Permissions.hasPermission(userId, 'sceneSettings') && [GENERATOR_MODES.WEATHER_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))) {
            const dia = new WeatherConfigDialog(canvas.scene._id)
            dia.render(true)
          }
        }
      },
      {
        name: 'dialogs.regionConfig.toggleName',
        title: 'dialogs.regionConfig.toggleTitle',
        icon: 'fas fa-solid fa-sliders',
        visible: Permissions.hasPermission(userId, 'sceneSettings') && [GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED)),
        button: true,
        onClick: () => {
          if (Permissions.hasPermission(userId, 'sceneSettings') && [GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))) {
            const dia = new RegionConfigDialog(canvas.scene._id)
            dia.render(true)
          }
        }
      },
      {
        name: 'dialogs.macroConfig.toggleName',
        title: 'dialogs.macroConfig.toggleTitle',
        icon: 'fas fa-solid fa-scroll',
        visible: Permissions.hasPermission(userId, 'sceneSettings') && (Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED) != GENERATOR_MODES.DISABLED),
        button: true,
        onClick: () => {
          if (Permissions.hasPermission(userId, 'sceneSettings') && (Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED) != GENERATOR_MODES.DISABLED)) {
            MacroConfigDialog._app = new MacroConfigDialog()
            MacroConfigDialog._app.render(true)
          }
        }
      },
      {
        name: 'settings.enableFx.toggleName',
        title: 'settings.enableFx.toggleTitle',
        icon: 'fas fa-solid fa-eye',
        visible: (Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED) != GENERATOR_MODES.DISABLED),
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
      },
      {
        name: 'select', // Hardcoded name by foundry. Needs to be called like that to work.
        title: 'layer.controls.select',
        icon: 'fas fa-expand',
        visible: Permissions.hasPermission(userId, 'sceneSettings')
      },
      {
        name: 'snapToGrid',
        title: 'layer.controls.snapToGrid',
        icon: 'fas fa-solid fa-frame',
        visible: (Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED) != GENERATOR_MODES.DISABLED),
        toggle: true,
        active: canvas.sceneweather?.snapToGrid,
        onClick: () => {
          if (Permissions.hasPermission(userId, 'sceneSettings')) {
            canvas.sceneweather.snapToGrid = !(canvas.sceneweather.snapToGrid)
            // Re-render Scene controls
            if (ui.controls) ui.controls.initialize()
          }
        }
      },
      {
        name: "weatherNode",
        title: "layer.controls.createMask",
        icon: "fa-regular fa-draw-polygon",
        visible: Permissions.hasPermission(userId, 'sceneSettings')
      },
      {
        name: "maskWeatherNode",
        title: "layer.controls.maskWeatherNode",
        icon: "fa-regular fa-draw-polygon",
        visible: Permissions.hasPermission(userId, 'sceneSettings'),
        onClick: () => {
          canvas.sceneweather.selectedTool = 'maskWeatherNode'
        }
      },
      {
        name: "emitterWeatherNode",
        title: "layer.controls.emitterWeatherNode",
        icon: "fa-regular fa-signal-stream",
        visible: Permissions.hasPermission(userId, 'sceneSettings'),
        onClick: () => {
          canvas.sceneweather.selectedTool = 'emitterWeatherNode'
        }
      },
      {
        name: "clear",
        title: "layer.controls.purgeNodes",
        icon: "fa-solid fa-trash",
        visible: Permissions.hasPermission(userId, 'sceneSettings'),
        button: true,
        onClick: () => {
          if (Permissions.hasPermission(userId, 'sceneSettings')) {
            canvas.sceneweather.deleteAll()
          }
        }
      }
    ]

    btns.splice(btns.findIndex(e => e.name === 'sounds') + 1, 0, {
      name: 'sceneweather',
      title: 'layer.title',
      icon: 'fas fa-solid fa-cloud-bolt-sun',
      layer: 'sceneweather',
      activeTool: 'select',
      tools: weatherOptions
    })
  })

})


/**
 * The SceneWeather layer, containing all WeatherNodes for controlling spatial weather and ambience
 * generation for tokens. See various WeatherNode attributes for an overview about the different kind
 * of modifierts for weather on the current scene to ambience.
 */
export class SceneWeatherLayer extends InteractionLayer {

  /**
   * Collection of possible weatherNode types to be selected for creating new nodes.
   */
  static nodeTypes = {
    'maskWeatherNode': {
      'icon': 'fa-regular fa-draw-polygon',
      'builder': (origin) => {
        // Start the new polygon mask
        const newWeatherNode = MaskWeatherNode.createMaskNodeAt(origin)
        return newWeatherNode
      }
    },
    'emitterWeatherNode': {
      'icon': 'fa-regular fa-signal-stream',
      'builder': (origin) => {
        // Start the new emitter
        const newWeatherNode = EmitterWeatherNode.createEmitterNodeAt(origin)
        return newWeatherNode
      }
    }
  }

  /**
   * Name of the currently selected key for the weatherNode type as per key of SceneWeatherLayer.nodeTypes
   * @type {string}
   */
  selectedTool = 'maskWeatherNode'

  /**
   * Modifiable WeatherNode instances as children of the Container.
   * The children are of @type{WeatherNode}
   * 
   * @type {PIXI.Container|null}
   */
  weatherNodesContainer = null

  /**
   * A Container, also child of this layer, containing all preview WeatherNode instances.
   * The children are of @type{WeatherNode}
   * @type {PIXI.Container|null}
   */
  preview = null

  /**
   * The border frame and resizing handles for the drawing.
   * @type {PIXI.Container}
   */
  _nodeFrame

  /**
   * Container for the scene clipboard of copied WeatherNodes. This will work
   * across scenes, so one can copy WeatherNodes from one to another scene.
   * @type {Array<WeatherNode>}
   */
  _clipboard = []

  /**
   * Track the set of WeatherNode on this layer which are currently controlled.
   * @type {Map<string,WeatherNode>}
   */
  controlledNodes = new Map()

  /**
   * An indicator wether currently a borderNode is controlled, wether drag, addition, settings.
   * null indicates no border control, where object indicates the border number to be actively controlled.
   * This is set by the @type BorderNodeHandle
   * @type {object} id - WeatherNode.id
   * @type {object} nodeNr - number
   */
  borderNodeControl = null

  /**
   * Local history of rollback-able actions on WeatherNodes in chronological order. Each element contains the
   * changes to be applied to rollback the action taken, so simply applying this array to c(r)ud functions
   * will roll back the modifications. Each object in the array contains
   * @type {string} type - the type of activity
   * @type {object} data - the data for the object change as well as its id
   */
  _history = []

  /**
   * The event listener holder for key presses, as some core keybindings of foundry
   * have hardcoded class instance checks we can not match nor change. So we have 
   * to do our own key handling for typical keyboard shortcuts.
   * @type {Function}
   */
  _onkeydown
  _onkeyup

  /**
   * Flag, weather the children of weatherNodesContainer is unsorted and needs sorting.
   * Is set to true after sorting.
   * @type {boolean}
   */
  sortDirty = true

  /**
   * Holder for all rendered WatherNodeConfig apps.
   * Key is the WeatherNode.id
   * @type {Map<string,WeatherNodeConfig>}
   */
  apps = {}

  /**
   * Flag for default snapping to the grid, grid/2
   */
  snapToGrid = true

  /**
   * Global creation state for the state engine on the canvas.sceneweather layer. Valid values are of 
   * Constants.CREATION_STATES
   * @type {number}
   */
  createState = CREATION_STATES.NONE

  /* --------------------- Properties ----------------------- */

  /**
   * Define an elevation property on this layer.
   * Render the SceneWeatherLayer above default weather effects from foundry
   * as well as above the SceneWeatherEffects layer.
   * 
   * @type {number}
   */
  get elevation() { return (canvas.weather?.elevation ?? 9999) + 2 }
  set elevation(value) {
    const weatherEffects = canvas.weather
    if (weatherEffects) {
      weatherEffects.elevation = value - 2
    }
  }

  /**
   * A convenience method for accessing the WeatherNode instances contained in this layer
   * @type {WeatherNode[]}
   * @readonly
   */
  get nodes() {
    return this.weatherNodesContainer?.children || []
  }

  /**
   * Returns the array of all controlled WeatherNodes on this layer.
   * @returns {WeatherNode[]}
   */
  get controlled() {
    return Array.from(this.controlledNodes.values())
  }

  /**
   * If nodes on this PlaceableLayer have a HUD UI, provide a reference to its instance
   * @type {BasePlaceableHUD|null}
   */
  get hud() {
    // inject the hud application in foundry as foundry is not build to be extended by other huds (yet)
    if (!canvas.hud.weatherNode) {
      canvas.hud.weatherNode = new WeatherNodeHud()
    }
    return canvas.hud.weatherNode
  }

  /**
   * Use an adaptive precision depending on the size of the grid
   * TODO ?
   * @type {number}
   */
  get gridPrecision() {
    if (canvas.scene.grid.type === CONST.GRID_TYPES.GRIDLESS) return 0
    //TODO if ( canvas.grid.isHex ) return this.options.controllableObjects ? 2 : 5; // Snap to corners or vertices
    return 2
  }

  /* --------------------- Static functions ----------------------- */

  /**
   * TODO
   
   */
  newInstanceFromData(weatherNodeData) {
    switch (weatherNodeData.type) {
      case NODE_TYPE.MASK:
        return new MaskWeatherNode(weatherNodeData)
      case NODE_TYPE.EMITTER:
        return new EmitterWeatherNode(weatherNodeData)
      default:
        return undefined
    }
  }


  /** @inheritdoc */
  static get layerOptions() {
    const layerOptions = foundry.utils.mergeObject(super.layerOptions, {
      name: "sceneweather",
      sortActiveTop: true,
      zIndex: 479
    })
    return layerOptions
  }

  /* --------------------- Public functions ----------------------- */

  /**
   * Creates weather nodes based on the provided data and adds them to a container.
   * 
   * @async
   * @param {Array} nodeDatas - An array of objects containing the weather node data.
   * @param {Object} options - An object containing options for the function.
   * @param {boolean} [options.forceId=false] - Whether to force the creation of a new ID for each weather node.
   * @param {Object} [options.addToContainer=this.weatherNodesContainer] - The container to which the weather nodes will be added.
   * @param {boolean} [options.control=false] - Whether to enable control options for the weather nodes.
   * @param {Object} [options.controlOptions={}] - An object containing the control options for the weather nodes.
   * @param {boolean} [options.storeHistory=true] - Whether to store the creation of the weather nodes in the history.
   * @param {boolean} [options.fireEvent=true] - Whether to fire an event for the creation of the weather nodes.
   * @returns {Array} - An array of the created weather nodes.
   */
  async createWeatherNodes(nodeDatas, { forceId = false, addToContainer = this.weatherNodesContainer, control = false, controlOptions = {}, storeHistory = true, fireEvent = true } = {}) {
    const newWeatherNodes = []
    const promises = nodeDatas.map(async nodeData => {
      // TODO don't update each individually, if there are more then one to be more resource friendly on client updates
      const createdNodeData = await WeatherNodeData.create(nodeData, forceId)
      const weatherNode = this.weatherNodeFromData(createdNodeData)
      if (addToContainer) {
        await addToContainer.addChild(weatherNode).draw()
      }
      if (control) {
        weatherNode.control(controlOptions)
      }
      newWeatherNodes.push(weatherNode)
      return weatherNode
    })
    await Promise.all(promises)
    if (storeHistory) {
      // add event to the history
      this.storeHistory('deleteWeatherNode', {
        'weatherNodes': newWeatherNodes
      })
    }

    Logger.debug('SceneWeatherLayer.createWeatherNodes(...)', { 'nodeDatas': nodeDatas, 'forceId': forceId, 'addToContainer': addToContainer, 'control': control, 'controlOptions': controlOptions, 'storeHistory': storeHistory, 'fireEvent': fireEvent, 'newWeatherNodes': newWeatherNodes })
    if (fireEvent) {
      Hooks.callAll(EVENTS.CREATE_WEATHER_NODES, {
        'update': [], 'deletion': [], 'addition': [newWeatherNodes.map(newWeatherNode => {
          return newWeatherNode.id
        })]
      })
    }

    return newWeatherNodes
  }

  /**
   * Finds and returns a WeatherNode object with a matching ID.
   * @param {number} id - The ID of the weather node to be found.
   * @returns {WeatherNode|undefined} - The WeatherNode object that matches the provided ID or undefined in case no such WeatherNode with the ID exists.
   */
  getNode(id) {
    const weatherNode = this.nodes.find(weatherNode => {
      return (weatherNode.id == id)
    })
    return weatherNode
  }

  /**
   * Update weather nodes in the scene.
   *
   * @async
   * @function updateNodes
   * @param {Object[]} [nodesToUpdate=[]] - An array of objects containing the properties to update for each weather node.
   * @param {boolean} [options.storeHistory=true] - Whether to store the update event in the scene history.
   * @param {boolean} [options.fireEvent=true] - Whether to fire a 'updateWeatherNodes' event after updating the nodes.
   * @returns {Promise} A promise that resolves when all weather nodes have been updated.
   */
  async updateNodes(nodesToUpdate = [], { storeHistory = true, fireEvent = true } = {}) {
    const matches = []
    const weatherNodeUpdates = []
    const promises = this.weatherNodesContainer.children.map(async node => {
      const update = nodesToUpdate.find(u => u.id === node.id)
      if (update) {
        let weatherNodeUpdate = {
          'id': update.id
        }
        Object.keys(WeatherNodeData.metadata).forEach(key => {
          if (key in update) {
            if (WeatherNodeData.metadata[key].type == 'Array') {
              weatherNodeUpdate[key] = node.data[key].map(({ x, y, permeable }) => ({ x, y, permeable }))
              node.data[key] = update[key].map(({ x, y, permeable }) => ({ x, y, permeable }))
            } else {
              weatherNodeUpdate[key] = node.data[key]
              node.data[key] = update[key]
            }
          }
        })
        node.data.normalize(false)
        const promise = node.data.update()
        node.refresh()
        matches.push(node.id)
        weatherNodeUpdates.push(weatherNodeUpdate)
        return promise
      }
    })
    await Promise.all(promises)

    if (storeHistory) {
      // add event to the history
      this.storeHistory('updateWeatherNode', {
        'weatherNodeUpdates': weatherNodeUpdates
      })
    }
    Logger.debug('SceneWeatherLayer.updateNodes(...)', { 'nodesToUpdate': nodesToUpdate, 'update': matches, 'storeHistory': storeHistory, 'fireEvent': fireEvent })
    if (fireEvent) Hooks.callAll(EVENTS.UPDATE_WEATHER_NODES, { 'update': matches, 'deletion': [], 'addition': [] })
  }

  /**
   * Delete weather nodes from the weather layer.
   * 
   * @async
   * @param {WeatherNode[]} deletableNodes - Array of WeatherNode instances to delete.
   * @param {Object} [options] - Optional configuration object.
   * @param {HTMLElement} [options.removeFromContainer=this.weatherNodesContainer] - Container from which to remove the weather nodes.
   * @param {boolean} [options.storeHistory=true] - Whether to store the deletion event in the history.
   * @param {boolean} [options.fireEvent=true] - Whether to trigger the deletion event.
   * @returns {string[]} - Array of deleted WeatherNode IDs.
   */
  async deleteWeatherNodes(deletableNodes, { removeFromContainer = this.weatherNodesContainer, storeHistory = true, fireEvent = true } = {}) {
    if (storeHistory) {
      // add event to the history
      this.storeHistory('createWeatherNode', {
        'weatherNodeDatas': deletableNodes.map(deletableNode => {
          return deletableNode.data.toObject()
        })
      })
    }
    let deletedNodeIds = []
    const promises = deletableNodes.map(weatherNode => {
      // remove weatherNode from controlledNodes
      this.controlledNodes.delete(weatherNode.id)
      // add id to list of removed weatherNodeIds
      deletedNodeIds.push(weatherNode.id)
      if (removeFromContainer) {
        // Remove nodes from this.weatherNodesContainer Container
        this.weatherNodesContainer.removeChild(weatherNode)
        // destroy weatherNode visually
        weatherNode.destroy()
      }
      // Delete WeatherNodeData
      return weatherNode.data.delete()
    })
    await Promise.all(promises)

    Logger.debug('SceneWeatherLayer.deleteWeatherNodes(...)', { 'deletableNodes': deletableNodes, 'removeFromContainer': removeFromContainer, 'storeHistory': storeHistory, 'fireEvent': fireEvent, 'deletedNodeIds': deletedNodeIds })
    if (fireEvent) {
      Hooks.callAll(EVENTS.DELETE_WEATHER_NODES, { 'update': [], 'deletion': deletedNodeIds, 'addition': [] })
    }
    return deletedNodeIds
  }

  /**
   * Returns an array of all WeatherNodes that cover at the given location.
   * @returns {Array{WeatherNode}}
   */
  getNodesAt({ x = 0, y = 0, onlyEnabled = true } = {}) {
    return this.nodes.filter(weatherNode => {
      if ((!onlyEnabled) || weatherNode.data.enabled) {
        return weatherNode.coversPoint(x, y)
      } else {
        return false
      }
    })
  }

  /**
   * Select all WeatherNode instances which fall within a coordinate rectangle.
   *
   * @param {number} x      The top-left x-coordinate of the selection rectangle
   * @param {number} y      The top-left y-coordinate of the selection rectangle
   * @param {number} width  The width of the selection rectangle
   * @param {number} height The height of the selection rectangle
   * @param {object} releaseOptions   Optional arguments provided to any called release() method
   * @param {object} controlOptions   Optional arguments provided to any called control() method
   * @param {object} [options]        Additional options to configure selection behaviour.
   * @param {boolean} [options.releaseOthers=true]  Whether to release other selected nodes.
   * @returns {boolean}       A boolean for whether the controlled set was changed in the operation
   */
  selectObjects({ x, y, width, height, releaseOptions = {}, controlOptions = {} } = {}, { releaseOthers = true } = {}) {
    const oldSet = this.controlled

    // identify WeatherNodes that are visible
    const controllable = this.nodes.filter(weatherNode => weatherNode.visible)
    const newSet = controllable.filter(weatherNode => {
      const nodeCenter = weatherNode.center
      return Number.between(nodeCenter.x, x, x + width) && Number.between(nodeCenter.y, y, y + height)
    })

    // maybe release WeatherNodes no longer controlled
    const toRelease = oldSet.filter(weatherNode => !newSet.includes(weatherNode))
    if (releaseOthers) toRelease.forEach(weatherNode => weatherNode.release(releaseOptions))

    // control new WeatherNodes
    if (Fal.isEmpty(controlOptions)) controlOptions.releaseOthers = false
    const toControl = newSet.filter(weatherNode => !oldSet.includes(weatherNode))

    this.controlledNodes.clear()
    toControl.forEach(weatherNode => {
      if (weatherNode.control(controlOptions)) {
        this.controlledNodes.set(weatherNode.id, weatherNode)
      }
    })

    // return a boolean for whether the control set was changed
    return (releaseOthers && toRelease.length) || (toControl.length > 0)
  }

  /**
    * Clear the contents of the preview container, restoring visibility of original (non-preview) nodes.
    */
  clearPreviewContainer() {
    if (!this.preview) return
    this.preview.removeChildren().forEach(pixiContainer => {
      // Removes all internal references and listeners as well as removes children from the display list. Do not use a Container after calling destroy.
      // See https://pixijs.download/dev/docs/PIXI.Container.html
      // children -> if set to true, all the children will have their destroy method called as well. 'options' will be passed on to those calls.
      pixiContainer.destroy({ children: true })
    })
  }

  /**
   * Acquire control over all PlaceableObject instances which are visible and controllable within the layer.
   * @param {object} options      Options passed to the control method of each object
   * @returns {PlaceableObject[]}  An array of nodes that were controlled
   */
  controlAll(options = {}) {
    // if we are in creation of a new WeatherNode, ignore clicks
    if (this.createState > CREATION_STATES.NONE) return
    options.releaseOthers = false
    const controllable = this.nodes.filter(weatherNode => weatherNode.visible)
    for (let weatherNode of controllable) {
      weatherNode.control(options)
      this.controlledNodes.set(weatherNode.id, weatherNode)
    }
    return []
  }

  /**
   * Release all controlled PlaceableObject instance from this layer.
   * @param {object} options   Options passed to the release method of each object
   * @returns {number}         The number of PlaceableObject instances which were released
   */
  releaseAll(options = {}) {
    let released = 0
    for (let weatherNode of this.nodes) {
      if (!weatherNode.controlled) continue
      weatherNode.release(options)
      released++
    }
    this.controlledNodes.clear()
    return released
  }

  /**
   * A helper method to prompt for deletion of all PlaceableObject instances within the Scene
   * Renders a confirmation dialogue to confirm with the requester that all nodes will be deleted
   * @returns {Promise<Document[]>}    An array of Document nodes which were deleted by the operation
   */
  async deleteAll() {
    return Dialog.confirm({
      title: Fal.i18n('dialogs.deleteAllNodes.title'),
      content: Fal.i18n('dialogs.deleteAllNodes.content'),
      yes: async () => {
        this.weatherNodesContainer.removeChildren()
        this.controlledNodes.clear()
        this.borderNodeControl = null
        this._nodeFrame.refresh()
        const deletedIds = (await WeatherNodeData.deleteAll()).map(id => 'WeatherNode.' + id)
        Hooks.callAll(EVENTS.DELETE_WEATHER_NODES, { 'update': [], 'deletion': deletedIds, 'addition': [] })
      }
    })
  }



  /* --------------------- Private functions, tool specific ----------------------- */

  /**
   * Creates a weather node object based on the given data.
   * @param {object} weatherNodeData - The data of the weather node to be created.
   * @param {string} weatherNodeData.type - The type of the weather node to be created.
   * @returns {object|undefined} - A weather node object or undefined if the type is unknown.
   */
  weatherNodeFromData(weatherNodeData) {
    switch (weatherNodeData.type) {
      case NODE_TYPE.MASK:
        return new MaskWeatherNode(weatherNodeData)
      case NODE_TYPE.EMITTER:
        return new EmitterWeatherNode(weatherNodeData)
      default:
        return undefined
    }
  }

  /**
   * Creates a new node based on the selected tool at the specified origin
   * 
   * @param {Vector2} origin - The location where the new node will be created
   * @returns {Object|undefined} - Returns a new node object based on the selected tool or undefined if the active tool is not a weather or node tool
   */
  _startNewNodeAt(origin) {
    if (Object.keys(SceneWeatherLayer.nodeTypes).includes(game.activeTool) || game.activeTool == 'weatherNode') {
      Logger.trace('SceneWeatherLayer._startNewNodeAt(...)', { 'selectedTool': this.selectedTool })
      if (Object.keys(SceneWeatherLayer.nodeTypes).includes(this.selectedTool)) {
        return SceneWeatherLayer.nodeTypes[this.selectedTool].builder(origin)
      }
      return undefined
    }
  }

  /* --------------------- Private functions ----------------------- */

  /** @override */
  async _draw(options) {
    this.borderNodeControl = null // this.actionState = ACTION_STATES.NONE

    // create the WeatherNodes container which can be sorted
    this.weatherNodesContainer = this.addChild(new PIXI.Container())
    // If set to true, the container will sort its children by zIndex value when updateTransform() is called, or manually if sortChildren() is called.
    // This actually changes the order of elements in the array, so should be treated as a basic solution that is not performant compared to other solutions, such as PixiJS Layers
    // Also be aware of that this may not work nicely with the addChildAt() function, as the zIndex sorting may cause the child to automatically sorted to another position.
    this.weatherNodesContainer.sortableChildren = true
    this.weatherNodesContainer.visible = false

    // if the user has no permissions, stop here and don't render/add any WeatherNodes
    const userPermission = Permissions.hasPermission(Fal.userID(), 'sceneSettings')
    if (!userPermission) return

    // set the sort function
    // Sorts children by zIndex. Previous order is maintained for 2 children with the same zIndex.
    // See https://pixijs.download/dev/docs/PIXI.Container.html
    this.weatherNodesContainer.sortChildren = this._sortObjectsByElevation.bind(this.weatherNodesContainer)

    // create preview container which is always above weatherNodesContainer
    this.preview = this.addChild(new PIXI.Container())

    // Control Border
    this._nodeFrame = this.addChild(new NodeFrame(this))

    // draw the WeatherNodes of this scene
    const promises = WeatherNodeData.loadAll().map(nodeData => {
      return this.weatherNodesContainer.addChild(this.weatherNodeFromData(nodeData)).draw()
    })

    // wait for all nodes to draw, before setting them visible in the container
    this.visible = true
    await Promise.all(promises)
    this.weatherNodesContainer.visible = true
  }


  /** @override */
  async _tearDown(options) {
    // clear history data
    this._history = []
    // release all WeatherNodes currently controlled
    this.controlled.forEach(weatherNode => {
      weatherNode.release()
    })
    this.controlledNodes.clear()
    this.borderNodeControl = null
    // clear all huds
    if (this.hud) this.hud.clear()
    // close all configuration dialogs
    const promises = Object.values(this.apps).map(weatherNodeConfig => {
      return weatherNodeConfig.close()
    })
    await Promise.all(promises)
    // remove the container for the WeatherNodes
    this.weatherNodesContainer = null
    return super._tearDown()
  }

  /**
   * Override the default PIXI.Container behavior for how nodes in this container are sorted.
   * Sorts children by zIndex. Previous order is maintained for 2 children with the same zIndex.
   * @see https://pixijs.download/dev/docs/PIXI.Container.html
   * @private
   */
  _sortObjectsByElevation() {
    this.children.sort((nodeA, nodeB) => {
      return (nodeA.data.z - nodeB.data.z)
    })
    // Should children be sorted by zIndex at the next updateTransform call.
    // Will get automatically set to true if a new child is added, or if a child's zIndex changes.
    // See https://pixijs.download/dev/docs/PIXI.Container.html
    this.sortDirty = false
  }

  /** @override */
  _activate() {
    this.weatherNodesContainer.visible = true
    // for each weatherNode, refresh them
    this.nodes.forEach(weatherNode => {
      weatherNode.refresh()
    })
    this.borderNodeControl = null
    // Assign key handlers
    this._onkeydown = this._handleKeydown.bind(this)
    document.addEventListener("keydown", this._onkeydown)
    this._onkeyup = this._handleKeyup.bind(this)
    document.addEventListener("keyup", this._onkeyup)

    this._nodeFrame.activateListeners()

    // enable events for children
    // Determines if the children to the displayObject can be clicked/touched Setting this to false allows PixiJS to bypass a recursive hitTest function
    // See https://pixijs.download/dev/docs/PIXI.Container.html
    canvas.primary.interactiveChildren = true
  }

  /** @override */
  _deactivate() {
    // disable events for children
    canvas.primary.interactiveChildren = false

    // reset key handlers
    if (this._onkeydown) {
      document.removeEventListener("keydown", this._onkeydown)
      this._onkeydown = null
    }
    if (this._onkeyup) {
      document.removeEventListener("keyup", this._onkeyup)
      this._onkeyup = null
    }

    this.borderNodeControl = null
    this.weatherNodesContainer.visible = false
    this.releaseAll()
    // for each weatherNode, refresh them
    this.nodes.forEach(weatherNode => {
      weatherNode.refresh()
    })
    this.clearPreviewContainer()
  }

  /**
   * Handle left mouse-click events which originate from the Canvas stage.
   * @see {@link Canvas._onClickLeft}
   * @param {PIXI.InteractionEvent} event      The PIXI InteractionEvent which wraps a PointerEvent
   * @protected
   */
  _onClickLeft(event) {
    if (this.hud) this.hud.clear()
    if (game.settings.get("core", "leftClickRelease")) this.releaseAll()
  }

  /**
   * Start a left-click drag workflow originating from the Canvas stage.
   * @see {@link Canvas._onDragLeftStart}
   * @param {PIXI.InteractionEvent} event      The PIXI InteractionEvent which wraps a PointerEvent
   * @protected
   */
  async _onDragLeftStart(event) {
    this.createState = CREATION_STATES.NONE
    // clear any existing preview
    this.clearPreviewContainer()
    event.data.preview = null
    // Snap the origin to the grid
    const { origin, originalEvent } = event.data
    if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
      event.data.origin = canvas.grid.getSnappedPosition(origin.x, origin.y, this.gridPrecision)
    }

    // start new weatherNode, type depending on selected tool
    const newWeatherNode = this._startNewNodeAt(event.data.origin)
    if (newWeatherNode) {
      // Register the ongoing creation
      this.createState = CREATION_STATES.POTENTIAL
      // Set the new node to the preview container for rendering...
      event.data.preview = this.preview.addChild(newWeatherNode)
      return newWeatherNode.draw()
    }
  }

  /**
   * Continue a left-click drag workflow originating from the Canvas stage.
   * @see {@link Canvas._onDragLeftMove}
   * @param {PIXI.InteractionEvent} event      The PIXI InteractionEvent which wraps a PointerEvent
   * @protected
   */
  async _onDragLeftMove(event) {
    const { preview } = event.data
    if (!preview) return
    if (this.createState >= CREATION_STATES.POTENTIAL) {

      // limit rate of interaction
      if (Utils.throttleInteractivity(this)) return

      let { destination, origin, originalEvent } = event.data

      // Snap the origin to the grid
      if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
        origin = canvas.grid.getSnappedPosition(origin.x, origin.y, canvas.sceneweather.gridPrecision)
        destination = canvas.grid.getSnappedPosition(destination.x, destination.y, canvas.sceneweather.gridPrecision)
      }

      // placing the second border point for the polygon mask
      this.createState = await preview.creationDragLeftMove(this.createState, destination)
      // end creation
      if (this.createState == CREATION_STATES.NONE) {
        // clear the preview
        this.clearPreviewContainer()
      }
    }
  }

  /**
   * Conclude a left-click drag workflow originating from the Canvas stage.
   * @see {@link Canvas._onDragLeftDrop}
   * @param {PIXI.InteractionEvent} event      The PIXI InteractionEvent which wraps a PointerEvent
   * @protected
   */
  async _onDragLeftDrop(event) {
    const { preview } = event.data
    // In-progress creation of new weatherNode
    if ((this.createState === CREATION_STATES.POTENTIAL)) {
      event.data.originalEvent.preventDefault()
      // Snap the origin to the grid
      const { destination, originalEvent } = event.data
      if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
        event.data.destination = canvas.grid.getSnappedPosition(destination.x, destination.y, this.gridPrecision)
      }
      this.createState = await preview.creationDragLeftDrop(this.createState, event.data.destination)
      // end creation
      if (this.createState == CREATION_STATES.NONE) {
        // clear the preview
        this.clearPreviewContainer()
      }
    }
  }

  /**
   * TODO
   */
  async _onClickLeft2(event) {
    const { preview } = event.data
    // In-progress polygon
    if ((this.createState === CREATION_STATES.POTENTIAL)) {
      event.data.originalEvent.preventDefault()
      // Snap the origin to the grid
      const { destination, originalEvent } = event.data
      if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
        event.data.destination = canvas.grid.getSnappedPosition(destination.x, destination.y, this.gridPrecision)
      }

      this.createState = await preview.creationClickLeft2(this.createState, event.data.destination)
      // end creation
      if (this.createState == CREATION_STATES.NONE) {
        // clear the preview
        this.clearPreviewContainer()
      }
    }
  }

  /**
   * Cancel a left-click drag workflow originating from the Canvas stage.
   * @see {@link Canvas._onDragLeftDrop}
   * @param {PointerEvent} event              A right-click pointer event on the document.
   * @protected
   */
  _onDragLeftCancel(event) {
    this.clearPreviewContainer()
  }

  /**
   * Handle right mouse-click events which originate from the Canvas stage.
   * @see {@link Canvas._onClickRight}
   * @param {PIXI.InteractionEvent} event      The PIXI InteractionEvent which wraps a PointerEvent
   * @protected
   */
  _onClickRight(event) {
    // if in creation
    if ((this.createState === CREATION_STATES.POTENTIAL)) {
      event.data.originalEvent.preventDefault()
      // cancel new mask
      this._onDragLeftCancel(event)
      event.data.preview = null
      this.createState = CREATION_STATES.NONE
      return
    }
    if (this.hud) this.hud.clear()
  }

  /**
   * TODO
   */
  async _onShiftRelease(event) {
    // Identify nodes which are candidates for deletion
    const controlledNodes = this.controlled
    if (!controlledNodes.length) return
    // find hovered borderNode
    const weatherNode = controlledNodes.find(weatherNode => {
      return weatherNode._borders.handle.find(borderHandle => {
        return borderHandle.hover
      })
    })
    if (weatherNode) {
      weatherNode._onShiftRelease(event)
    }
  }

  /**
   * TODO
   */
  async _onShift(event) {
    // Identify nodes which are candidates for deletion
    const controlledNodes = this.controlled
    if (!controlledNodes.length) return
    // find hovered borderNode
    const weatherNode = controlledNodes.find(weatherNode => {
      return weatherNode._borders.handle.find(borderHandle => {
        return borderHandle.hover
      })
    })
    if (weatherNode) {
      weatherNode._onShift(event)
    }
  }

  /**
   * Handle a DELETE keypress while this layer is active.
   * @see {@link ClientKeybindings._onDelete}
   * @param {KeyboardEvent} event             The delete key press event
   * @protected
   */
  async _onDelete(event) {
    // Identify nodes which are candidates for deletion
    const controlledNodes = this.controlled
    if (!controlledNodes.length) return
    // Restrict to nodes which can be deleted
    const deletableNodes = controlledNodes.reduce((resultNodes, weatherNode) => {
      if (weatherNode.data.locked) return resultNodes
      resultNodes.push(weatherNode)
      // check for control release of borderNodes
      if (this.borderNodeControl && this.borderNodeControl.id === weatherNode.id) {
        this.borderNodeControl = null
      }
      return resultNodes
    }, [])
    // if nothing is to delete, bail out
    if (!deletableNodes.length) return
    this.deleteWeatherNodes(deletableNodes)
    this._nodeFrame.refresh()
    // Hooks.callAll(`updateWeatherNodes`, { 'update': [], 'deletion': deletedNodeIds, 'addition': [] })  // TODO module name
  }

  /**
   * TODO
   */
  _handleKeyup(event) {
    if (game.keyboard.hasFocus) return
    switch (event.key) {
      case "Shift":
        this._onShiftRelease(event)
        break
    }
  }

  /**
   * Handle text entry in an active text tool
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeydown(event) {
    if (game.keyboard.hasFocus) return
    // if we are in creation of a new WeatherNode, ignore clicks
    if (this.createState > CREATION_STATES.NONE) return
    switch (event.key) {
      case "Shift":
        // Ignore events when an input is focused, or when ALT or CTRL modifiers are applied
        if (event.altKey || event.ctrlKey || event.metaKey) return
        this._onShift(event)
        break
      case "Delete":
        // Ignore events when an input is focused, or when ALT or CTRL modifiers are applied
        if (event.altKey || event.ctrlKey || event.metaKey) return
        this._onDelete(event)
        break
      case "z":
        if (event.altKey || event.metaKey || !event.ctrlKey) return
        this._onUndo(event)
        break
      case "c":
        if (event.altKey || event.metaKey) return
        this._onCopy(event)
        break
      case "v":
        if (event.altKey || event.metaKey) return
        this._onPaste(event)
        break
    }
  }

  /**
   * Handle action to copy data to clipboard
   * @param {KeyboardEventContext} context    The context data of the event
   * @private
   */
  _onCopy(context) {
    // don't handly copy of selected text
    if (window.getSelection().toString() !== "") return false
    this._clipboard = this.controlled
    if (this._clipboard.length) Logger.info('Copied data for ' + this._clipboard.length + ' WeatherNodes', true)  // TODO i18n
  }

  /* -------------------------------------------- */

  /**
   * Handle Paste action
   * @param {KeyboardEventContext} context    The context data of the event
   * @private
   */
  _onPaste(context) {
    if (this._clipboard.length) {
      const pos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage)
      this.pasteObjects(pos, { snap: canvas.sceneweather.snapToGrid && !context.isShift })
    }
  }

  /**
   * Paste currently copied PlaceableObjects back to the layer by creating new copies
   * @param {Point} position      The destination position for the copied data.
   * @param {object} [options]    Options which modify the paste operation
   * @param {boolean} [options.hidden]    Paste data in a hidden state, if applicable. Default is false.
   * @param {boolean} [options.snap]      Snap the resulting nodes to the grid. Default is true.
   * @returns {Promise<Document[]>} An Array of created Document instances
   */
  async pasteObjects(position, { snap = true } = {}) {
    if (!this._clipboard.length) return
    // get the left-most object in the set
    this._clipboard.sort((weatherNodeA, weatherNodeB) => weatherNodeA.data.x - weatherNodeB.data.x)
    const { x, y } = this._clipboard[0].data
    const toCreate = []
    const rect = canvas.dimensions.rect
    // iterate over nodes
    for (let weatherNodeSource of this._clipboard) {
      const sourceData = weatherNodeSource.data.toObject()
      delete sourceData._id
      // constrain the destination position
      let dest = { x: position.x + (sourceData.x - x), y: position.y + (sourceData.y - y) }
      if (snap) dest = canvas.grid.getSnappedPosition(dest.x, dest.y)
      // only paste, if inside the canvas rectangle
      if (dest.x >= rect.x && (dest.x + sourceData.width) <= (rect.x + rect.width) &&
        dest.y >= rect.y && (dest.y + sourceData.height) <= (rect.y + rect.height)) {
        // Stage the creation
        toCreate.push(foundry.utils.mergeObject(sourceData, {
          x: dest.x,
          y: dest.y
        }))
      }
    }
    // no weathernodes pasted
    if (!toCreate.length) return
    // initially release all previous weathernodes
    this.releaseAll()
    await this.createWeatherNodes(toCreate, { 'control': true, 'controlOptions': { 'releaseOthers': false } })

    /**
     * A hook event that fires when any PlaceableObject is pasted onto the
     * Scene. Substitute the PlaceableObject name in the hook event to target a
     * specific PlaceableObject type, for example "pasteToken".
     * @function pastePlaceableObject
     * @memberof hookEvents
     * @param {PlaceableObject[]} copied The PlaceableObjects that were copied
     * @param {object[]} createData      The new nodes that will be added to the Scene
     */
    Hooks.call(EVENTS.PASTE_WEATHER_NODES, this._clipboard, toCreate)
    Logger.info('Pasted data for ' + toCreate.length + 'WeatherNodes.', true) // TODO i18n
  }

  /* -------------------------------------------- */

  /**
   * Record a new CRUD event in the history log so that it can be undone later
   * @param {string} type   The event type (create, update, delete)
   * @param {Object[]} data   The object data
   */
  storeHistory(type, data) {
    Logger.debug('SceneWeatherLayer.storeHistory(...)', { 'type': type, 'data': data })
    if (this._history.length >= 10) this._history.shift()
    this._history.push({ type, data })
  }

  /**
   * Handle Undo action
   * @param {KeyboardEventContext} context    The context data of the event
   * @private
   */
  _onUndo(context) {
    if (!canvas.ready) return false
    if (this._history.length) {
      const event = this._history.pop()
      switch (event.type) {
        case 'deleteWeatherNode':
          const weatherNodes = event.data.weatherNodes
          this.deleteWeatherNodes(weatherNodes, { 'storeHistory': false })
          this._nodeFrame.refresh()
          return true
        case 'createWeatherNode':
          const weatherNodeDatas = event.data.weatherNodeDatas
          this.createWeatherNodes(weatherNodeDatas, { 'forceId': true, 'storeHistory': false })
          return true
        case 'updateWeatherNode':
          const weatherNodeUpdates = event.data.weatherNodeUpdates
          this.updateNodes(weatherNodeUpdates, { 'storeHistory': false })
          return true
      }
      return false
    } else {
      Logger.info('No more steps to undo...', true)  // TODO i18n
    }
  }


}

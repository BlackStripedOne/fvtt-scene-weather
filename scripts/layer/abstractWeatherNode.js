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

import { Logger } from '../utils.js'
import { WeatherNodeGraphics } from './weatherNodeGraphics.js'
import { WeatherNodeData } from './weatherNodeData.js'
import { EVENTS, CREATION_STATES } from '../constants.js'

export class AbstractWeatherNode extends PIXI.Container {

  static weatherNodeType = 'WeatherNode'

  /**
   * The drawing graphic which is rendered as a PIXI.Graphics subclass in the SceneWeatherLayer.
   * @type {WeatherNodeGraphics}
   */
  _nodeGraphic

  /**
   * The underlaying data for this node
   * @type {WeatherNodeData}
   */
  _nodeData

  /**
   * An indicator for whether the object is currently a hover target
   * @type {boolean}
   */
  hover = false

  /**
   * Flag sotring wether this weatherNode is controlled or nod
   * @type {boolean}
   */
  controlled = false

  /**
   * Contains a copy of the original WeatherNodeData before modification by drawhandle
   * @type {WeatherNodeData|undefined}
   * @protected
   */
  _original

  /**
   * Passthrough certain drag operations on locked objects.
   * @type {boolean}
   * @protected
   */
  _dragPassthrough = false

  constructor(nodeData) {
    super()
    this.visible = false
    this.controlled = false
    // assign data and normalize, in case normalization results in changes, normalize will update the data
    this._nodeData = nodeData
    this._nodeData.normalize()

    // Visual representation
    this._nodeGraphic = this.addChild(new WeatherNodeGraphics(this))
  }

  /*--------------------- Properties --------------------- */

  /**
   * Direct access to the data of the WeatherNodeData instance        
   * @readonly
   * @returns {WeatherNodeData}
   */
  get data() {
    return this._nodeData
  }

  /**
   * A unique identifier which is used to uniquely identify elements on the canvas related to this object.
   * @readonly
   * @type {string} - The unique document id or document type as preview.
   */
  get id() {
    return this.constructor.weatherNodeType + this.data.id
  }

  /**
   * The bounding box for this PlaceableObject.
   * This is required if the layer uses a Quadtree, otherwise it is optional
   * @readonly
   * @returns {Rectangle}
   */
  get bounds() {
    Logger.trace('WeatherNode.bounds > get')
    const { x, y, width, height } = this.data
    return new PIXI.Rectangle(x, y, width, height).normalize()
  }

  /**
   * The central coordinate pair of the placeable object based on it's own width and height
   * @readonly
   * @type {PIXI.Point}
   */
  get center() {
    Logger.trace('WeatherNode.center > get')
    const { x, y, width, height } = this.data
    return new PIXI.Point(x + (width / 2), y + (height / 2))
  }

  /*--------------------- Functions, public, generic --------------------- */

  /**
   * Draw the WeatherNode into the SceneWeatherLayer
   * @returns {Promise<WeatherNode>}  The drawn object
   */
  async draw() {
    this.visible = true
    this.refresh()
    Hooks.callAll(EVENTS.DRAW_WEATHER_NODE, this)
    // only for non-volatile, have listeners
    if (this.id != this.constructor.weatherNodeType + '.preview') {
      this.interactive = true
      this.buttonMode = true
      this.activateListeners()
    }
    return this
  }

  /**
   * Clone the WeatherNode, returning a new WeatherNode with identical attributes.
   * The returned WeatherNode is non-interactive, and has no assigned ID.     
   * @returns {WeatherNode}  A new WeatherNode with identical data
   */
  clone() {
    const clonedNodeData = this.data.clone()
    const clonedNode = new this.constructor(clonedNodeData)
    clonedNode._original = this
    clonedNode.interactive = false
    clonedNode.controlled = this.controlled
    return clonedNode
  }

  /**
  * Assume control over a WeatherNode, flagging it as controlled and enabling downstream behaviors
  * @param {Object} options                  Additional options which modify the control request
  * @param {boolean} options.releaseOthers   Release any other controlled objects first
  * @returns {boolean}                        A flag denoting whether control was successful
  */
  control(options = {}) {
    // release other controlled WeatherNodes
    if (options.releaseOthers !== false) {
      for (const weatherNodeToRelease of canvas.sceneweather.controlled) {
        if (weatherNodeToRelease !== this) weatherNodeToRelease.release()
      }
    }

    // fast return path if already controlled node, or only a volatile preview
    if (this.controlled || this._nodeData.id == 'preview') return true

    // toggle control status
    this.controlled = true

    // set in controlled nodes map of layer
    canvas.sceneweather.controlledNodes.set(this.id, this)
    this.refresh()
    // fire an on-control Hook
    Hooks.callAll(EVENTS.CONTROL_WEATHER_NODE, this, this.controlled)
    return true
  }

  /**
   * Release control over a WeatherNode, removing it from the controlled set
   * @param {object} options          Options which modify the releasing workflow
   * @returns {boolean}               A Boolean flag confirming the WeatherNode was released.
   */
  release(options = {}) {
    // remove from controlled nodes map of layer
    canvas.sceneweather.controlledNodes.delete(this.id)
    if (!this.controlled) return true
    this.controlled = false
    // remove potential huds
    if (canvas.sceneweather.hud && (canvas.sceneweather.hud.weatherNode === this)) canvas.sceneweather.hud.clear()
    this.refresh()
    // fire an on-release Hook        
    Hooks.callAll(EVENTS.CONTROL_WEATHER_NODE, this, this.controlled)
    return true
  }

  /*--------------------- Functions, public, type specific, abstract --------------------- */

  /**
   * Handling the movement of the dragges left mouse button when creating a new instance.
   * @abstract
   * @async
   * @param {SceneWeatherLayer.CREATION_STATES|number} creationState - the current creation state when calling this handler
   * @param {object} position - the mouse drop position
   * @param {object} position.x - the mouse drop x position
   * @param {object} position.y - the mouse drop y position
   * @returns {SceneWeatherLayer.INTERACTION_STATE|number} - the new state reached after calling this handler
   */
  async creationDragLeftMove(creationState, position) {
    throw new Error('abstract method creationDragLeftMove needs to be implemented by inheriting class')
  }

  /**
   * Handling the drop or mouse release of the left mouse when creating a new instance.
   * @abstract
   * @async
   * @param {SceneWeatherLayer.CREATION_STATES|number} creationState - the current creation state when calling this handler
   * @param {object} position - the mouse drop position
   * @param {object} position.x - the mouse drop x position
   * @param {object} position.y - the mouse drop y position
   * @returns {SceneWeatherLayer.INTERACTION_STATE|number} - the new state reached after calling this handler
   */
  async creationDragLeftDrop(creationState, position) {
    throw new Error('abstract method creationDragLeftDrop needs to be implemented by inheriting class')
  }

  /**
   * Handling the double left-click of the mouse when creating a new instance.
   * @abstract
   * @async
   * @param {SceneWeatherLayer.CREATION_STATES|number} creationState - the current creation state when calling this handler
   * @param {object} position - the mouse drop position
   * @param {object} position.x - the mouse drop x position
   * @param {object} position.y - the mouse drop y position
   * @returns {SceneWeatherLayer.INTERACTION_STATE|number} - the new state reached after calling this handler
   */
  async creationClickLeft2(creationState, position) {
    throw new Error('abstract method creationClickLeft2 needs to be implemented by inheriting class')
  }

  /**
   * This function is filters an incoming weather model using an outside weather model, specific to the weathernodes' implementation.
   * @abstract
   * @param {object} incomingFilterModel - An object representing the incoming weather model that needs to be filtered.
   * @param {object} outsideWeatherModel - An object representing the outside weather model that will be used to filter the incoming weather model.
   */
  filterWeatherModel(incomingFilterModel, outsideWeatherModel) {
    throw new Error('abstract method filterWeatherModel needs to be implemented by inheriting class')
  }

  /**
   * Shows or renders the WeatherNodeConfig Application which is used to configure the properties
   * of this WeatherNode' specific configuration parameters
   * @abstract
   * @param {PIXI.InteractionEvent} event - that triggered the interaction
   * @type {FormApplication}
   */
  showConfigApp(event) {
    throw new Error('abstract method showConfigApp needs to be implemented by inheriting class')
  }

  /**
   * Activate interactivity for the WeatherNode
   * @abstract
   */
  activateListeners() {
    throw new Error('abstract method activateListeners needs to be implemented by inheriting class')
  }

  /**
   * Checks wether the point given by the coordinates is covered by this WeatherNode.
   * For masks it simply means, the point is inside of the masking-area and for emitters
   * this is, when the point is in the spere of influence of the emitter.
   * 
   * @abstract
   * @param {number} x    The x coordinate to check against
   * @param {number} y    The y coordinate to check against
   * @returns {boolean}   True, if the point is covered by this WeatherNodes' area of influence.
   */
  coversPoint(x, y) {
    throw new Error('abstract method coversPoint needs to be implemented by inheriting class')
  }

  /**
   * Destroys the context and graphic of this weatherNode and implementation specific context.
   */
  destroy() {
    // remove potential huds
    if (canvas.sceneweather.hud && (canvas.sceneweather.hud.weatherNode === this)) canvas.sceneweather.hud.clear()
    super.destroy()
  }

  /**
   * Synchronize the appearance of this WeatherNode with the properties of
   * its represented WeatherNodeData.       
   */
  refresh() {
    this._nodeGraphic.refresh()
    const { enabled, locked } = this.data
    if (this.controlled && !locked) {
      this._refreshHud()
    }
    canvas.sceneweather._nodeFrame.refresh()
    this.alpha = enabled ? 1.0 : 0.5
    this._setPosition()
  }

  /*--------------------- Functions, private --------------------- */

  /**
   * Synchronize the position of the WeatherNode with the position of
   * its represented WeatherNodeData.
   */
  _setPosition() {
    const { x, y, z, width, height } = this.data
    this.pivot.set(width / 2, height / 2)
    this.position.set(x + this.pivot.x, y + this.pivot.y)
    this.zIndex = z // This is a temporary solution to ensure the sort order updates
    this.angle = 0 // rotation
    this.visible = true
  }

  /**
   * Refreshed the hud in case the currently selected weatherNode has a hud enabled
   */
  _refreshHud() {
    const hud = canvas.sceneweather.hud
    if (hud) {
      if (hud.weatherNode == this) {
        hud.setPosition()
      }
    }
  }

  /*--------------------- Enent Handling, General --------------------- */

  /**
   * TODO
   * @abstract
   */
  async _onShift(event) {
    throw new Error('abstract method _onShift needs to be implemented by inheriting class')
  }

  /**
   * TODO
   * @abstract
   */
  async _onShiftRelease(event) {
    throw new Error('abstract method _onShiftRelease needs to be implemented by inheriting class')
  }

  /*--------------------- Enent Handling, Abstract --------------------- */




  /**
   * Callback actions which occur when a mouse-drag action is first begun.
   * @see MouseInteractionManager#_handleDragStart
   * @param {PIXI.InteractionEvent} event  The triggering canvas interaction event
   */
  async _onDragLeftStart(event) {
    Logger.trace('WeatherNode._onDragLeftStart(...)', { 'event': event, 'this': this })

    // if weatherNode is locked, pass this event through
    if (this._nodeData.locked) {
      this._dragPassthrough = true
      return canvas._onDragLeftStart(event)
    }

    // start the move the whole weatherNode
    const controlledWeatherNodes = canvas.sceneweather.controlled
    const clonedWeatherNodes = []
    for (let controlledWeatherNode of controlledWeatherNodes) {
      if (controlledWeatherNode._nodeData.locked) continue
      // clone the node
      const c = controlledWeatherNode.clone()
      controlledWeatherNode._preview = c
      clonedWeatherNodes.push(c)

      // draw the clone
      c.draw().then(c => {
        canvas.sceneweather.preview.addChild(c)
        c._onDragStart()
      });
    }
    event.data.clones = clonedWeatherNodes
  }

  /**
  * Begin a drag operation from the perspective of the preview clone.
  * Modify the appearance of both the clone (this) and the original (_original) object.
  * @protected
  */
  _onDragStart() {
    this.alpha = 0.8
    this._original.alpha = 0.4
    this.visible = true
  }

  /**
   * Conclude a drag operation from the perspective of the preview clone.
   * Modify the appearance of both the clone (this) and the original (_original) object.
   * @protected
   */
  _onDragEnd() {
    Logger.trace('WeatherNode._onDragEnd(...)', { 'this': this })
    this.visible = false
    if (this._original) {
      if (this._original.data.locked) this._original.data.locked = false
      this._original.data.update()
      this._original.alpha = 1.0
    }
  }

  /**
       * Callback actions which occur on a mouse-move operation.
       * @see MouseInteractionManager#_handleDragMove
       * @param {PIXI.InteractionEvent} event  The triggering canvas interaction event
       */
  _onDragLeftMove(event) {
    // ignore events when this weatherNode is not controlled
    if (!this.controlled) return

    // if forcing passthrough of the event, we will return the focus back to the canvas itself
    if (this._dragPassthrough) return canvas._onDragLeftMove(event)

    let { clones, destination, origin, originalEvent } = event.data
    canvas._onDragCanvasPan(originalEvent)

    // Snap the origin to the grid
    if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
      origin = canvas.grid.getSnappedPosition(origin.x, origin.y, canvas.sceneweather.gridPrecision)
      destination = canvas.grid.getSnappedPosition(destination.x, destination.y, canvas.sceneweather.gridPrecision)
    }

    const dx = destination.x - origin.x
    const dy = destination.y - origin.y
    for (let clonedWeatherNode of clones || []) {
      // safekeeping of valid values
      const validDimensions = clonedWeatherNode.data.toObject()
      // set dimension information based on the original weatherNode, stored at _original on the clone
      clonedWeatherNode.data.dimensionsFrom(clonedWeatherNode._original.data)
      clonedWeatherNode.data.x = clonedWeatherNode._original.data.x + dx
      clonedWeatherNode.data.y = clonedWeatherNode._original.data.y + dy

      clonedWeatherNode.data.normalize()
      const rect = canvas.dimensions.rect
      if (clonedWeatherNode.data.x >= rect.x && (clonedWeatherNode.data.x + clonedWeatherNode.data.width) <= (rect.x + rect.width) &&
        clonedWeatherNode.data.y >= rect.y && (clonedWeatherNode.data.y + clonedWeatherNode.data.height) <= (rect.y + rect.height)) {
        clonedWeatherNode.refresh()
      } else {
        clonedWeatherNode.data.dimensionsFrom(validDimensions)
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Callback actions which occur on a mouse-move operation.
   * @see MouseInteractionManager#_handleDragDrop
   * @param {PIXI.InteractionEvent} event  The triggering canvas interaction event
   * @returns {Promise<*>}
   */
  async _onDragLeftDrop(event) {
    // disable potentially set drag passthrough
    if (this._dragPassthrough) {
      this._dragPassthrough = false
      return canvas._onDragLeftDrop(event)
    }

    const { clones, destination, originalEvent } = event.data

    if (!clones || !canvas.dimensions.rect.contains(destination.x, destination.y)) return false

    const updates = clones.map(c => {
      let dest = { x: c.data.x, y: c.data.y }
      // Snap the origin to the grid
      if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
        dest = canvas.grid.getSnappedPosition(c.data.x, c.data.y, canvas.sceneweather.gridPrecision)
      }
      c.data.x = dest.x
      c.data.y = dest.y
      c.data.normalize()
      return { id: c._original.id, x: c.data.x, y: c.data.y, width: c.data.width, height: c.data.height }
    })
    // return canvas.scene.updateEmbeddedDocuments(this.document.documentName, updates)
    return canvas.sceneweather.updateNodes(updates)
  }

  /* -------------------------------------------- */

  /**
   * Callback actions which occur on a mouse-move operation.
   * @see MouseInteractionManager#_handleDragCancel
   * @param {MouseEvent} event  The triggering mouse click event
   */
  _onDragLeftCancel(event) {
    Logger.trace('WeatherNode._onDragLeftCancel(...)', { 'this': this })
    if (this._dragPassthrough) {
      this._dragPassthrough = false
      return canvas._onDragLeftCancel(event)
    }
    canvas.sceneweather.clearPreviewContainer()
    this.refresh()
  }

  /* -------------------------------------------- */

  /**
   * Set this WeatherNode as being hovered in by setting the flag on this.
   * @param {PIXI.InteractionEvent} event - The triggering canvas interaction event
   * @param {object} options                Options which customize event handling
   * @param {boolean} [options.hoverOutOthers=true] Trigger hover-out behavior on sibling objects
   */
  _onHoverIn(event, { hoverOutOthers = true } = {}) {
    if (hoverOutOthers) {
      for (const weatherNode of canvas.sceneweather.nodes) {
        if (weatherNode !== this) weatherNode._onHoverOut(event)
      }
    }
    this.hover = true
    Hooks.callAll(`hoverWeatherNode`, this, this.hover)
  }

  /**
   * Set this WeatherNode as being hovered out by setting the flag on this.
   * @param {PIXI.InteractionEvent} event - The triggering canvas interaction event
   */
  _onHoverOut(event) {
    this.hover = false
    Hooks.callAll(`hoverWeatherNode`, this, this.hover) // TODO namespace
  }

  /* -------------------------------------------- */

  /**
   * Callback actions which occur on a single left-click event to assume control of the object
   * @see MouseInteractionManager#_handleClickLeft
   * @param {PIXI.InteractionEvent} event  The triggering canvas interaction event
   */
  _onClickLeft(event) {
    Logger.trace('WeatherNode._onClickLeft(' + canvas.sceneweather.createState + ')')

    // if we are in creation of a new WeatherNode, ignore clicks
    if (canvas.sceneweather.createState > CREATION_STATES.NONE) return
    const hud = canvas.sceneweather.hud
    if (hud) hud.clear()

    // Add or remove the Placeable Object from the currently controlled set
    const oe = event.data.originalEvent
    if (this.controlled) {
      // if this weatherNode is controlled and the shift key was held while clicking and no shadowBorderNode is active
      if (oe.shiftKey && this._shadowBorderNode == null) {
        if (event.data.nodeAdded) {
          delete event.data.nodeAdded
        } else {
          return this.release()
        }
      }
    } else {
      return this.control({ releaseOthers: !oe.shiftKey })
    }
  }


  /* -------------------------------------------- */

  /**
   * Callback actions which occur on a single right-click event to configure properties of the object
   * @see MouseInteractionManager#_handleClickRight
   * @param {PIXI.InteractionEvent} event  The triggering canvas interaction event
   */
  _onClickRight(event) {
    const hud = canvas.sceneweather.hud
    if (hud) {
      const releaseOthers = !this.controlled && !event.data.originalEvent.shiftKey
      this.control({ releaseOthers })
      if (hud.weatherNode === this) {
        hud.clear()
      } else {
        hud.bind(this)
      }
    }
  }



}

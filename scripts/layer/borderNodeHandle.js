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

import { Logger, Utils } from '../utils.js'

/**
 * A PIXI.Graphics subclass that represents a handle for a border node of a weather node.
 * Interactivity is to drag a boderNode to move it. Hold Ctrl to move it without snapping.
 * Right-click to remove the borderNode.
 * @class
 * @extends PIXI.Graphics
 */
export class BorderNodeHandle extends PIXI.Graphics {
  /**
   * The weather node this handle is associated with.
   * @type {WeatherNode}
   * @private
   */
  _weatherNode

  /**
   * The number of the borderNodes of the _weatherNode this instance represents.
   * In case this is set to -1 this is a shadow node, not an actual node.
   * @type {number|-1}
   */
  _borderNodeNr

  /**
   * Backup before modification for history
   * @type {WeatherNodeData|undefined}
   */
  _originNode

  /**
   * The mask type as in @type {Constants.AMBIENCE_TYPE.*} or -1 if this is a shadowBorderNode.
   * Used to determin the drawing color / shape.
   * @type {Constants.AMBIENCE_TYPE.*|-1}
   */
  _maskType

  /**
   * Holder for the shadowBorderNode variant of the position and distance to the mouse positiong
   * so a hover-over can be determined
   */
  _borderNodePosition = {
    x: 0,
    y: 0,
    d: null
  }

  /**
   * Track whether the handle is hovered
   * @type {boolean}
   */
  hover = false

  /**
   * A mouse interaction manager instance which handles mouse workflows related to this object.
   * @type {MouseInteractionManager}
   */
  mouseInteractionManager = null

  /**
   * Creates a new borderNode handle or shadow variant of it, depending on the parameters given.
   * If borderNodeNr is -1 this borderNode is considered to be a shadow variant, only for visualizing
   * where a potentially new borderNode will be places. In this case, position will supply the x,y coordinates
   * as well as the mouse distance to that position for hover-visualization.
   * @param {WeatherNode|null} weatherNode - The weatherNode object associated with the borderNode.
   * @param {Object} [options={}] - An optional object containing parameters for the borderNode.
   * @param {number} [options.borderNodeNr=-1] - The number of the borderNode. If set to -1, the borderNode is a shadow variant.
   * @param {Object} [options.position={}] - An object containing the x and y coordinates of the borderNode, as well as the mouse distance to that position for hover-visualization.
   */
  constructor(weatherNode = null, { borderNodeNr = -1, position = {} } = {}) {
    super()
    if (borderNodeNr == -1 && weatherNode == null) {
      // this is a shadow border node handle
      this._borderNodePosition = position
      this._weatherNode = null
      this._borderNodeNr = -1
      this.alpha = 0.5
      this._maskType = -1
    } else {
      this._weatherNode = weatherNode
      this._borderNodeNr = borderNodeNr
      this._maskType = this._weatherNode.data.mask
    }
    this._drawHandle()
  }

  /* --------------------- Properties ----------------------- */

  /**
   * Returns the line width value based on the current canvas dimensions size.
   * @returns {number} The line width value.
   */
  get lw() {
    if (canvas.dimensions.size > 150) return 7
    else if (canvas.dimensions.size > 100) return 5
    else return 3
  }

  /**
   * Returns a boolean indicating whether or not the current instance is a shadow node.
   * A node is considered a shadow node if it doesn't have a weather node and its border node number is -1.
   * @returns {boolean} Returns true if the node is a shadow node, false otherwise.
   */
  get isShadow() {
    return this._weatherNode == null && this._borderNodeNr == -1
  }

  /* --------------------- Public functions ----------------------- */

  /**
   * Refreshes the weather node handle based on its current state
   */
  refresh() {
    if (this._maskType != -1 && this._maskType != this._weatherNode.data.mask) {
      this._maskType = this._weatherNode.data.mask
      this._drawHandle()
    }
    if (this.isShadow) {
      this.position.set(this._borderNodePosition.x, this._borderNodePosition.y)
      const distance = this._borderNodePosition.d || 9000
      if (distance < this.lw * 4) {
        this.alpha = 1.0
        this.hover = true
        this.scale.set(1.5, 1.5)
      } else {
        this.alpha = 0.5
        this.hover = false
        this.scale.set(1.0, 1.0)
      }
    } else {
      const borderNodeData = this._weatherNode.data.borderNodes[this._borderNodeNr]
      this.position.set(borderNodeData.x, borderNodeData.y)
    }
    this.hitArea = new PIXI.Rectangle(-16, -16, 32, 32) // Make the handle easier to grab
  }

  /**
   * Sets the position of the border node.
   * @param {Object} options - The options object.
   * @param {number} options.x - The x coordinate.
   * @param {number} options.y - The y coordinate.
   * @param {number|null} [options.d=null] - The d coordinate (optional).
   */
  setPosition({ x, y, d = null } = {}) {
    this._borderNodePosition.x = x
    this._borderNodePosition.y = y
    this._borderNodePosition.d = d
  }

  /**
   * Activates all listeners for this border.
   */
  activateListeners() {
    const mgr = Utils.createInteractionManager(this, {
      hoverIn: this._onHoverIn,
      hoverOut: this._onHoverOut,

      clickRight: this._onClickRight,
      dragLeftStart: this._onDragLeftStart,
      dragLeftMove: this._onDragLeftMove,
      dragLeftDrop: this._onDragLeftDrop,
      dragLeftCancel: this._onDragLeftCancel
    })
    this.mouseInteractionManager = mgr.activate()
    this.interactive = true
  }

  /* --------------------- Private functions ----------------------- */

  /**
   * Draws the handle for a node.
   * If this is a shadow node, a little plus symbol will be drawn.
   */
  _drawHandle() {
    // TODO draw little plus symbol in case this is a shadow node
    const borderColor = this._maskType == -1 ? 0xffffff : this._weatherNode.data.maskColor
    // Determine circle radius and line width
    const lw = this.lw
    const circleRadius = this.hover ? lw * 4 : lw * 3

    // draw node handle
    this.lineStyle(lw, 0x000000, 1.0)
      .beginFill(borderColor, 1.0)
      .drawCircle(0, 0, circleRadius)
      .endFill()

    this.buttonMode = true
  }

  /**
   * Assigns control of the current weather node to the current instance.
   */
  _assumeControl() {
    canvas.sceneweather.borderNodeControl = {
      id: this._weatherNode.id,
      nodeNr: this._borderNodeNr
    }
  }

  /**
   * Yields control of the current weather node to another instance, if possible.
   * @returns {boolean} - true if control was yielded, false otherwise
   */
  _yieldControl() {
    if (this._canControl()) {
      canvas.sceneweather.borderNodeControl = null
      return true
    } else {
      return false
    }
  }

  /**
   * Checks if the current instance is in control of the current weather node.
   * @returns {boolean} - true if the current instance is in control, false otherwise
   */
  _isInControl() {
    if (canvas.sceneweather.borderNodeControl) {
      const { id, nodeNr } = canvas.sceneweather.borderNodeControl
      if (id != this._weatherNode.id) {
        return false
      }
      if (nodeNr != this._borderNodeNr) {
        return false
      }
      return true
    }
    return false
  }

  /**
   * Checks if the current instance can take control of the current weather node.
   * @returns {boolean} - true if the current instance can take control, false otherwise
   */
  _canControl() {
    // only, when no other borderNode is in active control at the moment
    if (canvas.sceneweather.borderNodeControl) {
      return this._isInControl()
    }
    return true
  }

  /* -------------------------------------------- */
  /*  Interactivity                               */
  /* -------------------------------------------- */

  /**
   * Handle mouse-over event on a control handle
   * @param {PIXI.InteractionEvent} event   The mouseover event
   * @protected
   * @calledBy this.createInteractionManager
   */
  _onHoverIn(event) {
    //  only, when no other borderNode is in active control at the moment
    if (!this._canControl()) return

    const handle = event.target
    handle.scale.set(1.5, 1.5)
    event.data['borderNodeHandle'] = event.target
    this.hover = true
  }

  /**
   * Handle mouse-out event on a control handle
   * @param {PIXI.InteractionEvent} event   The mouseout event
   * @protected
   * @calledBy this.createInteractionManager
   */
  _onHoverOut(event) {
    //  only, when no other borderNode is in active control at the moment
    if (this._isInControl()) return

    const { borderNodeHandle } = event.data
    borderNodeHandle.scale.set(1.0, 1.0)
    this.hover = false
  }

  /**
   * Handles the start of a left drag event on the current object.
   * Only executes when no other border node is in active control and the current object is not a shadow.
   * @param {MouseEvent} event - The mouse event that triggered the function.
   */
  _onDragLeftStart(event) {
    // only, when no other borderNode is in active control at the moment
    if (!this._canControl()) return
    if (this.isShadow) return

    this.scale.set(1.5, 1.5)
    this.hover = true

    this._originNode = this._weatherNode.data.toObject()
    // this.active = true
    this._assumeControl()
  }

  /**
   * Handle left drag move event for the weather node's border node
   * @param {Object} event - The event object containing the drag data.
   * @param {Object} event.data - The drag data object.
   * @param {Object} event.data.destination - The destination of the drag movement.
   * @param {Object} event.data.originalEvent - The original event that triggered the drag movement.
   */
  _onDragLeftMove(event) {
    // only, when no other borderNode is in active control at the moment
    if (!this._isInControl()) return

    if (this.isShadow) return

    // limit rate of interaction
    if (Utils.throttleInteractivity(this)) return

    let { destination, originalEvent } = event.data

    // Snap the origin to the grid
    if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey) {
      destination = canvas.grid.getSnappedPosition(
        destination.x,
        destination.y,
        canvas.sceneweather.gridPrecision
      )
    }

    // pan the canvas if the drag event approaches the edge
    canvas._onDragCanvasPan(originalEvent)

    // update Drawing dimensions
    this._weatherNode.data.setBorderNode(
      destination,
      canvas.dimensions.size * 0.5,
      this._borderNodeNr
    )
    this._weatherNode.data.normalize(false) // don't immediately update to not trigger a scene update
    this._weatherNode.refresh()
  }

  /**
   * Function that handles the left drag and drop event of a weather node.
   * @param {Event} event - The drag and drop event object.
   */
  _onDragLeftDrop(event) {
    // only, when no other borderNode is in active control at the moment
    if (!this._isInControl()) return

    if (this.isShadow) return
    /*
        // add event to the history
        this._originNode.id = this._weatherNode.id
        delete this._originNode._id
        canvas.sceneweather.storeHistory('updateWeatherNode', {
          'weatherNodeUpdates': [this._originNode]
        })
        */
    const clonedData = this._weatherNode.data.clone()
    const nodeToUpdate = {
      id: this._weatherNode.id,
      borderNodes: clonedData.borderNodes
    }
    this._weatherNode.data.setBorderNode(
      {
        x: this._originNode.borderNodes[this._borderNodeNr].x + this._originNode.x,
        y: this._originNode.borderNodes[this._borderNodeNr].y + this._originNode.y
      },
      canvas.dimensions.size * 0.5,
      this._borderNodeNr
    )
    // Update this WeatherNode with the new borderNode
    canvas.sceneweather.updateNodes([nodeToUpdate])

    delete event.data._borderNodePosition
    this._onHoverOut(event)
    // this.active = false
    this._yieldControl()
    this._originNode = null
  }

  /**
   * This function is called when a left drag gesture is cancelled. It restores the original position of the border node
   * that was being dragged before the gesture was cancelled, and sets the scale of the interaction manager to 1.0.
   * @param {MouseEvent} event - The event object for the drag cancellation.
   */
  _onDragLeftCancel(event) {
    if (!this._originNode) return
    // only, when no other borderNode is in active control at the moment
    if (!this._canControl()) return

    if (this.isShadow) return
    // Restore original borderNode
    this._weatherNode.data.setBorderNode(
      {
        x: this._originNode.borderNodes[this._borderNodeNr].x + this._originNode.x,
        y: this._originNode.borderNodes[this._borderNodeNr].y + this._originNode.y
      },
      canvas.dimensions.size * 0.5,
      this._borderNodeNr
    )
    this._weatherNode.data.normalize(false) // don't immediately update to not trigger a scene update
    this.scale.set(1.0, 1.0)
    this.hover = false
    // this.active = false
    this._yieldControl()
    this._weatherNode.refresh()
  }

  /**
   * Handles the click event on the right button of a border node, and updates the WeatherNode if the shape is valid.
   * @param {MouseEvent} event - The MouseEvent object for the click event.
   */
  _onClickRight(event) {
    // only, when no other borderNode is in active control at the moment
    if (!this._canControl()) return

    if (!this.isShadow) {
      const borderNodes = this._weatherNode.data.borderNodes
      if (borderNodes.length > 3) {
        // clone the data for the test of valid polygonal shape
        const dataClone = this._weatherNode.data.clone()
        dataClone.borderNodes.splice(this._borderNodeNr, 1)
        dataClone.normalize()
        if (dataClone._isPolygonValid(canvas.dimensions.size * 0.5)) {
          this._yieldControl()
          const nodeToUpdate = dataClone.toObject()
          nodeToUpdate.id = this._weatherNode.id
          delete nodeToUpdate._id

          // Update this WeatherNode with the new borderNode
          canvas.sceneweather.updateNodes([nodeToUpdate])

          delete event.data.borderNodeHandle
        } else {
          Logger.info(
            'Removing this BorderNode would result in an invalid shape. Please move this or another BorderNode first before trying to remove it again.',
            true
          ) // TODO i18n
        }
      } else {
        Logger.info(
          'A WeatherNodeMask needs to have at least 3 BorderNodes in the shape. You can remove the entire mask by selecting it and pressing the delete key.',
          true
        ) // TODO i18n
      }
    }
  }
}

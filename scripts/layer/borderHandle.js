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

import { DashLine } from './pixiDashedLine.js'
import { MASK_BORDER_TYPE } from '../constants.js'
import { Utils } from '../utils.js'
import { WeatherNodeData } from './weatherNodeData.js'

/**
 * A class representing a handle for a border in a WeatherNode element.
 * 
 * Functionality is to show a border that is mouse-hoverable. On hover there are
 * two possible control functions for interaction.
 * - Left click -> will toggle the border's permeability
 * - Shift-Left click -> will insert a new borderNode on that nodes nearest position
 * to the cursor.
 * 
 * @extends PIXI.Graphics
 */
export class BorderHandle extends PIXI.Graphics {

  /**
   * The weather node this handle is associated with.
   * @type {WeatherNode}
   * @private
   */
  _weatherNode

  /**
   * The border number this handle represents.
   * @type {number}
   * @private
   */
  _borderNr

  /**
   * Indicates whether the handle is currently being hovered over.
   * @type {boolean}
   */
  hover = false

  /**
   * Cached position of a new borderNode along this node with the distance of the cursor to that point
   * @type {{ x: number, y: number }} position
   * @type {{ d: number }} distance
   */
  _newNodePosition = {}

  /**
   * Default with of border lines.
   * @type {number}
   */
  _lw = 3

  /**
   * A mouse interaction manager instance which handles mouse workflows related to this object.
   * @type {MouseInteractionManager}
   */
  mouseInteractionManager = null

  /**
   * Creates a new border handle.
   * @param {weatherNode} weatherNode - The weather node this handle is associated with.
   * @param {number} borderNr - The border number this handle represents.
   */
  constructor(weatherNode, borderNr) {
    super()
    this._weatherNode = weatherNode
    this._borderNr = borderNr

    // Determine circle radius and line width
    if (canvas.dimensions.size > 150) this._lw = 7
    else if (canvas.dimensions.size > 100) this._lw = 5

    this.buttonMode = true
    this.refresh()
  }

  /* --------------------- Public functions ----------------------- */

  /**
   * Draws a border based on the weather node's data and the current border number.
   */
  refresh() {
    const startPoint = this._weatherNode.data.borderNodes[this._borderNr]
    const endPoint = this._weatherNode.data.borderNodes[(this._borderNr + 1) % this._weatherNode.data.borderNodes.length]
    const borderColor = this._weatherNode.data.maskColor

    // initialize the position for potential new border as a shadow brder
    this._newNodePosition.x = (startPoint.x + endPoint.x) / 2
    this._newNodePosition.y = (startPoint.y + endPoint.y) / 2
    this._newNodePosition.permeable = startPoint.permeable
    this._newNodePosition.d = null

    const hoverFactor = this.hover ? 1.5 : 1.0
    const scale = 1
    const useTexture = false
    const lw3 = this._lw * 3
    const lw5 = this._lw * 5
    const lw6 = this._lw * 6

    // draw the border
    this.clear()
    switch (startPoint.permeable) {
      default:
      case MASK_BORDER_TYPE.SOLID:
        // draw line
        this.lineStyle(this._lw * 3 * hoverFactor, 0x000000, 1.0)  // background black
          .moveTo(startPoint.x, startPoint.y)
          .lineTo(endPoint.x, endPoint.y)
        this.lineStyle(this._lw * hoverFactor, borderColor, 1.0)  // Foreground color
          .lineTo(startPoint.x, startPoint.y, 10, 3)
        break
      case MASK_BORDER_TYPE.PERMEABLE:
        const dashBg = new DashLine(this, {
          dash: [lw6, lw3, lw3, lw3, lw6],
          width: lw3 * hoverFactor,
          scale,
          useTexture,
          color: 0x000000,
          alignment: 0.5
        })
        dashBg.moveTo(startPoint.x, startPoint.y)
          .lineTo(endPoint.x, endPoint.y)

        const dash = new DashLine(this, {
          dash: [lw5, lw5, this._lw, lw5, lw5],
          width: this._lw * hoverFactor,
          scale,
          useTexture,
          color: borderColor,
          alignment: 0.5
        })
        dash.moveTo(startPoint.x, startPoint.y)
          .lineTo(endPoint.x, endPoint.y)
        break
    }
    // update line hit area
    this.hitArea = this._getWallHitPolygon(startPoint, endPoint, canvas.dimensions.size * 0.5)
  }

  /**
   * Retuns the position for a potential new borderNode at the line of the border.
   * This function is used by adding new borderNodes via WeatherNode
   */
  getNewNodePosition() {
    return this._newNodePosition
  }

  /**
   * Calculates the closest point on the border of a weather node to a given position.
   * @param {{ x: number, y: number }} position - The position for which to calculate the closest point on the border.
   * @returns {{ x: number, y: number, permeable: boolean }} - The closest point on the border, along with its permeability.
   */
  getPositionOnBorder(position) {
    // realign pivot to weatherNodes origin
    position.x -= this._weatherNode.data.x
    position.y -= this._weatherNode.data.y

    // get positions of the border
    const startPoint = this._weatherNode.data.borderNodes[this._borderNr]
    const endPoint = this._weatherNode.data.borderNodes[(this._borderNr + 1) % this._weatherNode.data.borderNodes.length]

    // Calculate the direction of the line
    const lineDirection = {
      x: endPoint.x - startPoint.x,
      y: endPoint.y - startPoint.y
    }

    // Calculate the squared length of the line
    const lineLengthSquared = lineDirection.x * lineDirection.x + lineDirection.y * lineDirection.y

    // Calculate the direction of the vector from the start position to the point
    const pointDirection = {
      x: position.x - startPoint.x,
      y: position.y - startPoint.y
    }

    // Calculate the dot product of the line direction and the point direction
    const dotProduct = lineDirection.x * pointDirection.x + lineDirection.y * pointDirection.y

    // Calculate the parameter along the line
    const parameter = dotProduct / lineLengthSquared

    // Calculate the closest point on the line
    return {
      x: startPoint.x + parameter * lineDirection.x,
      y: startPoint.y + parameter * lineDirection.y,
      permeable: startPoint.permeable
    }
  }

  /**
   * Activates all listeners for this border.
   */
  activateListeners() {
    const mgr = Utils.createInteractionManager(this, {
      hoverIn: this._onHoverIn,
      hoverOut: this._onHoverOut,
      clickLeft: this._onClickLeft
    })
    this.mouseInteractionManager = mgr.activate()
    this.off('mousemove').on('mousemove', this._onMouseMove.bind(this))
    this.interactive = true
  }

  /* --------------------- Private functions ----------------------- */

  /**
   * Compute an approximate Polygon which encloses the line segment providing a specific hitArea for the line
   * @param {{x: number, y: number}} startPoint
   * @param {{x: number, y: number}} endPoint
   * @param {number} size
   * @returns {PIXI.Polygon}      A constructed Poly
   */
  _getWallHitPolygon(startPoint, endPoint, size) {
    const shortLine = this._shortenLine(startPoint, endPoint, size / 2)
    startPoint = shortLine.startPoint
    endPoint = shortLine.endPoint

    const dx = endPoint.x - startPoint.x
    const dy = endPoint.y - startPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length < size) {
      return new PIXI.Polygon()
    }
    const angle = Math.atan2(dy, dx)
    const halfSize = size / 2
    const perpendicularAngle = angle + (Math.PI / 2)

    const x1 = startPoint.x + halfSize * Math.cos(perpendicularAngle)
    const y1 = startPoint.y + halfSize * Math.sin(perpendicularAngle)
    const x2 = endPoint.x + halfSize * Math.cos(perpendicularAngle)
    const y2 = endPoint.y + halfSize * Math.sin(perpendicularAngle)
    const x3 = endPoint.x - halfSize * Math.cos(perpendicularAngle)
    const y3 = endPoint.y - halfSize * Math.sin(perpendicularAngle)
    const x4 = startPoint.x - halfSize * Math.cos(perpendicularAngle)
    const y4 = startPoint.y - halfSize * Math.sin(perpendicularAngle)

    const polygon = new PIXI.Polygon(x1, y1, x2, y2, x3, y3, x4, y4)
    return polygon
  }

  /**
   * Function that shortens a given line by a given size from both ends, and returns the new start and end points
   * @param {Object} startPoint - The start point of the line in the form {x: number, y: number}
   * @param {Object} endPoint - The end point of the line in the form {x: number, y: number}
   * @param {number} size - The size by which the line should be shortened from both ends
   * @returns {Object} An object containing the new start and end points of the shortened line in the form {startPoint: {x: number, y: number}, endPoint: {x: number, y: number}}
   */
  _shortenLine(startPoint, endPoint, size) {
    const dx = endPoint.x - startPoint.x
    const dy = endPoint.y - startPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    const shortenedLength = length - size * 2
    const shortenedDx = Math.cos(angle) * shortenedLength
    const shortenedDy = Math.sin(angle) * shortenedLength

    const newStartPoint = {
      x: startPoint.x + size * Math.cos(angle),
      y: startPoint.y + size * Math.sin(angle)
    }
    const newEndPoint = {
      x: newStartPoint.x + shortenedDx,
      y: newStartPoint.y + shortenedDy
    }

    return {
      startPoint: newStartPoint,
      endPoint: newEndPoint
    }
  }

  /**
   * 
   * Calculates the angle between two lines defined by three points.
   * @param {Object} startPoint - The starting point of the first line.
   * @param {number} startPoint.x - The x-coordinate of the starting point.
   * @param {number} startPoint.y - The y-coordinate of the starting point.
   * @param {Object} endPoint - The ending point of the first line.
   * @param {number} endPoint.x - The x-coordinate of the ending point.
   * @param {number} endPoint.y - The y-coordinate of the ending point.
   * @param {Object} otherPoint - A point on the second line.
   * @param {number} otherPoint.x - The x-coordinate of the other point.
   * @param {number} otherPoint.y - The y-coordinate of the other point.
   * @returns {number} - The angle between the two lines in degrees.
   */
  _angleBetweenLines(startPoint, endPoint, otherPoint) {
    // Calculate the direction vectors for both lines
    const directionVector1 = {
      x: endPoint.x - startPoint.x,
      y: endPoint.y - startPoint.y
    }
    const directionVector2 = {
      x: otherPoint.x - startPoint.x,
      y: otherPoint.y - startPoint.y
    }

    // Calculate the dot product between the direction vectors
    const dotProduct = directionVector1.x * directionVector2.x + directionVector1.y * directionVector2.y

    // Calculate the magnitudes of the direction vectors
    const magnitude1 = Math.sqrt(directionVector1.x * directionVector1.x + directionVector1.y * directionVector1.y)
    const magnitude2 = Math.sqrt(directionVector2.x * directionVector2.x + directionVector2.y * directionVector2.y)

    // Calculate the cosine of the angle between the lines
    const cosine = dotProduct / (magnitude1 * magnitude2)

    // Calculate the angle between the lines in radians
    const angle = Math.acos(cosine)

    // Convert the angle to degrees
    const degrees = angle * 180 / Math.PI

    // If the angle is greater than 180 degrees, return the smaller supplementary angle
    // return degrees <= 180 ? degrees : 360 - degrees;
    return degrees
  }

  /**
   * This function adds a new border node to a weather node and updates the canvas scene accordingly.
   * It clones the data of the weather node, inserts the new border point at the correct position,
   * normalizes the border nodes, and updates the scene with the new data.
   *
   * If the weather node had a shadow border node, it removes the shadow node to update the parent node.
   *
   * @param {Object} event - The event object passed from the click event listener.
   * @param {Boolean} event.data.nodeAdded - Indicates whether a new node was added.
   * @param {Event} event.data.originalEvent - The original click event.
   */
  _onAddNode(event) {
    // we don't hover over the border anymore, there is a new borderNode now
    this.hover = false

    const clonedData = this._weatherNode.data.clone()
    clonedData.borderNodes.splice(this._borderNr + 1, 0, WeatherNodeData.newDefaultBorderPointAt(this._newNodePosition))
    clonedData.normalize()
    const nodeToUpdate = {
      'id': this._weatherNode.id,
      'borderNodes': clonedData.borderNodes
    }

    // Remove shadow on parent WeatherNode
    if (this._weatherNode._shadowBorderNode) {
      this._weatherNode.removeChild(this._weatherNode._shadowBorderNode)
      this._weatherNode._shadowBorderNode = null
    }

    // Update this WeatherNode with the new borderNode
    canvas.sceneweather.updateNodes([nodeToUpdate])

    event.data.nodeAdded = true
    event.data.originalEvent.preventDefault()
  }

  /**
   * This function toggles the permeability of a border node of a weather node and updates the canvas scene accordingly.
   * It clones the data of the weather node, toggles the permeability of the border node at the specified index,
   * and updates the scene with the new data.
   */
  _onToggleBorder() {
    const clonedData = this._weatherNode.data.clone()
    switch (clonedData.borderNodes[this._borderNr].permeable) {
      default:
      case MASK_BORDER_TYPE.SOLID:
        clonedData.borderNodes[this._borderNr].permeable = MASK_BORDER_TYPE.PERMEABLE
        break
      case MASK_BORDER_TYPE.PERMEABLE:
        clonedData.borderNodes[this._borderNr].permeable = MASK_BORDER_TYPE.SOLID
        break
    }
    const nodeToUpdate = {
      'id': this._weatherNode.id,
      'borderNodes': clonedData.borderNodes
    }
    // Update this WeatherNode with the new borderNode
    canvas.sceneweather.updateNodes([nodeToUpdate])
  }

  /* -------------------------------------------- */
  /*  Interactivity                               */
  /* -------------------------------------------- */

  /**
   * Handle mouse-over event on a border
   * @param {PIXI.InteractionEvent} event   The mouseover event
   * @protected
   * @calledBy this.createInteractionManager(...)
   */
  _onHoverIn(event) {
    // only, when no other borderNode is in active control at the moment    
    if (canvas.sceneweather.borderNodeControl) return

    // calculate the local coordinates for this layer
    const local = event.data.getLocalPosition(canvas.sceneweather)
    this._newNodePosition = this.getPositionOnBorder(local)
    const xDistance = local.x - this._newNodePosition.x
    const yDistance = local.y - this._newNodePosition.y
    this._newNodePosition.d = Math.sqrt(xDistance * xDistance + yDistance * yDistance)

    // send event to parent, when shift is pressed to potentially add shadow borderNodeHandle
    if (event.data.originalEvent.shiftKey) {
      this._weatherNode._onShift(event)
    }

    event.data["borderHandle"] = event.target
    this.hover = true
    this.refresh()
  }

  /**
   * Handle mouse-out event on a border
   * @param {PIXI.InteractionEvent} event   The mouseout event
   * @protected
   * @calledBy this.createInteractionManager
   * @calledBy this._onMouseUp
   */
  _onHoverOut(event) {
    // only, when no other borderNode is in active control at the moment
    if (canvas.sceneweather.borderNodeControl) return
    // remove shadow handle on parent weatherNode
    this._weatherNode._onShiftRelease(event)

    this.hover = false
    this.refresh()
  }

  /**
   * Toggle permeability for the border on click
   * @param {PIXI.InteractionEvent} event   The mousedown event
   * @protected
   * @calledBy this.createInteractionManager
   */
  _onClickLeft(event) {
    const { originalEvent } = event.data
    if (!this.hover) return
    // only, when no other borderNode is in active control at the moment
    if (canvas.sceneweather.borderNodeControl) return

    if (originalEvent.shiftKey && (this._weatherNode._shadowBorderNode && this._weatherNode._shadowBorderNode.hover)) {
      // Add a borderNode
      this._onAddNode(event)
    } else {
      // Toggle border permeability
      this._onToggleBorder()
    }
  }

  /**
   * Update the potential borderNode position for the new shadow borderNode based on the mouse movement.
   * @param {PIXI.InteractionEvent} event   The mousedown event
   * @protected
   * @calledBy PIXI.on
   */
  _onMouseMove(event) {
    if (!this.hover) return
    // only, when no other borderNode is in active control at the moment
    if (canvas.sceneweather.borderNodeControl) return

    // limit rate of interaction
    if (Utils.throttleInteractivity(this)) return

    const local = event.data.getLocalPosition(canvas.sceneweather)
    this._newNodePosition = this.getPositionOnBorder(local)
    const xDistance = local.x - this._newNodePosition.x
    const yDistance = local.y - this._newNodePosition.y
    this._newNodePosition.d = Math.sqrt(xDistance * xDistance + yDistance * yDistance)
  }

}

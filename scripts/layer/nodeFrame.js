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
import { WeatherNodeData } from './weatherNodeData.js'

/**
 * TODO
 */
export class NodeFrame extends PIXI.Container {
  /**
   * The reference to the border rectangle.
   * @type {PIXI.Graphics}
   */
  border

  /**
   * The reference to the border drag handle.
   * @type {ResizeHandle}
   */
  handle

  /**
   * Flag notinig that the drag handle of this frame if active.
   * @type {boolean}
   */
  _dragHandle = false

  /**
   * A mouse interaction manager instance which handles mouse workflows related to this object.
   * @type {MouseInteractionManager}
   */
  mouseInteractionManager = null

  /**
   * Create elements for the border around the WeatherNode representation.
   * This consists of a border and handles for interacting with.
   * @returns {PIXI.Container}
   */
  constructor() {
    super()
    this.border = this.addChild(new PIXI.Graphics())
    this.handle = this.addChild(new ResizeHandle([1, 1]))
  }

  /* --------------------- Properties ----------------------- */

  // Returns true if all controlled nodes are locked
  get allControlledLocked() {
    return canvas.sceneweather.controlled.some((weatherNode) => weatherNode.data.locked)
  }

  /* --------------------- Public functions ----------------------- */

  /**
   * Refresh the boundary frame which outlines the WeatherNode
   */
  refresh() {
    if (canvas.sceneweather.controlled.length === 0) {
      this.visible = false
      return
    }

    // determine the border color, based on whether the WeatherNode is locked
    const colors = CONFIG.Canvas.dispositionColors
    const borderColor = this.allControlledLocked ? colors.HOSTILE : colors.CONTROLLED

    // draw the padded border around the area of influence
    const pad = canvas.dimensions.size * 0.5
    const t = CONFIG.Canvas.objectBorderThickness
    const h = Math.round(t / 2)
    const o = Math.round(h / 2) + pad
    const border = this._getControlledBounds(this._dragHandle).clone().pad(o)

    this.border
      .clear()
      .lineStyle(t, 0x000000)
      .drawRoundedRect(border.x, border.y, border.width, border.height, o / 2)
      .lineStyle(h, borderColor)
      .drawRoundedRect(border.x, border.y, border.width, border.height, o / 2)

    // draw the handle for resizing
    this.handle.refresh(border)
    if (this.allControlledLocked) {
      this.handle.visible = false
    } else {
      this.handle.visible = true
    }

    this.visible = true
  }

  /**
   * Activates all listeners for this border.
   */
  activateListeners() {
    const mgr = Utils.createInteractionManager(this, {
      hoverIn: this._onHoverIn,
      hoverOut: this._onHoverOut,
      clickRight: this._onClickRight,
      dragLeftStart: this._onDragStart,
      dragLeftMove: this._onDragMove,
      dragLeftDrop: this._onDragEnd,
      dragLeftCancel: this._onDragCancel
    })
    this.mouseInteractionManager = mgr.activate()
    this.handle.interactive = true
  }

  /* --------------------- Private functions ----------------------- */

  /**
   * Calculates the bounding rectangle of the controlled objects within the scene weather layer.
   *
   * @param {boolean} precise - Optional parameter to calculate bounds with precise values
   *                            based on the borderNodes of each controlled object. Defaults to false.
   * @returns {PIXI.Rectangle}  Returns a PIXI.Rectangle object representing the bounding rectangle of
   *                            the controlled objects.
   */
  _getControlledBounds(precise = false) {
    const maxBounds = canvas.dimensions.rect

    const [minX, minY] = canvas.sceneweather.controlled.reduce(
      (acc, { data }) => {
        const x = precise
          ? Math.min(acc[0], data.x + Math.min(...data.borderNodes.map(({ x }) => x)))
          : Math.min(acc[0], data.x)
        const y = precise
          ? Math.min(acc[1], data.y + Math.min(...data.borderNodes.map(({ y }) => y)))
          : Math.min(acc[1], data.y)
        return [x, y]
      },
      [maxBounds.width + maxBounds.x, maxBounds.height + maxBounds.y]
    )

    const [maxX, maxY] = canvas.sceneweather.controlled.reduce(
      (acc, { data }) => {
        const x = precise
          ? Math.max(acc[0], data.x + Math.max(...data.borderNodes.map(({ x }) => x)))
          : Math.max(acc[0], data.x + data.width)
        const y = precise
          ? Math.max(acc[1], data.y + Math.max(...data.borderNodes.map(({ y }) => y)))
          : Math.max(acc[1], data.y + data.height)
        return [x, y]
      },
      [maxBounds.x, maxBounds.y]
    )
    return new PIXI.Rectangle(minX, minY, maxX - minX, maxY - minY)
  }

  /**
   * Rescales the dimensions of all controlled weatherNodes based on the given origin and current dimensions.
   * @async
   * @param {Object} origin - The original dimensions of the weatherNodes.
   * @param {Object} current - The current dimensions of the weatherNodes to rescale to.
   * @param {boolean} [centered=false] - Whether the rescaling should be centered around the origin.
   * @returns {Promise} A Promise that resolves when the rescaling is complete.
   */
  async _rescaleDimensions(origin, current, centered = false) {
    // don't allow inversion beyond origin root
    if (current.x < origin.x || current.y < origin.y) return
    if (
      centered &&
      (current.x < origin.x + origin.width / 2 || current.y < origin.y + origin.height / 2)
    )
      return
    // precalculations
    const minSize = canvas.dimensions.size * 0.5
    const centeredTL = centered
      ? {
        x: origin.x + (origin.x + origin.width - current.x),
        y: origin.y + (origin.y + origin.height - current.y)
      }
      : {}
    // scale all controlled weatherNodes
    for (const weatherNode of canvas.sceneweather.controlled) {
      if (weatherNode._original) {
        const testData = new WeatherNodeData(weatherNode.data.toObject())
        for (let i = 0; i < weatherNode.data.borderNodes.length; i++) {
          const originalBorderNode = weatherNode._original.borderNodes[i]
          if (centered) {
            testData.borderNodes[i].x =
              Utils.map(
                originalBorderNode.x + weatherNode.data.x,
                origin.x,
                origin.x + origin.width,
                centeredTL.x,
                current.x
              ) - weatherNode.data.x
            testData.borderNodes[i].y =
              Utils.map(
                originalBorderNode.y + weatherNode.data.y,
                origin.y,
                origin.y + origin.height,
                centeredTL.y,
                current.y
              ) - weatherNode.data.y
          } else {
            testData.borderNodes[i].x =
              Utils.map(
                originalBorderNode.x + weatherNode.data.x,
                origin.x,
                origin.x + origin.width,
                origin.x,
                current.x
              ) - weatherNode.data.x
            testData.borderNodes[i].y =
              Utils.map(
                originalBorderNode.y + weatherNode.data.y,
                origin.y,
                origin.y + origin.height,
                origin.y,
                current.y
              ) - weatherNode.data.y
          }
        }
        if (testData._isPolygonValid(minSize)) {
          for (let i = 0; i < weatherNode.data.borderNodes.length; i++) {
            weatherNode.data.borderNodes[i].x = testData.borderNodes[i].x
            weatherNode.data.borderNodes[i].y = testData.borderNodes[i].y
          }
          weatherNode.data.x = testData.x
          weatherNode.data.y = testData.y
          weatherNode.data.width = testData.width
          weatherNode.data.height = testData.height
        }
        weatherNode.refresh()
      }
    }
  }

  /**
   * Calculate the new lower right corner position based on a fixed aspect ratio
   * @param {Object} newLowerRight - The new lower right corner position of the rectangle
   * @param {number} newLowerRight.x - The x coordinate of the new lower right corner
   * @param {number} newLowerRight.y - The y coordinate of the new lower right corner
   * @param {Object} origin - The original rectangle
   * @param {number} origin.x - The x coordinate of the upper left corner of the original rectangle
   * @param {number} origin.y - The y coordinate of the upper left corner of the original rectangle
   * @param {number} origin.width - The width of the original rectangle
   * @param {number} origin.height - The height of the original rectangle
   * @returns {Object} - The new lower right corner position of the rectangle with the fixed aspect ratio
   * @returns {number} x - The x coordinate of the new lower right corner
   * @returns {number} y - The y coordinate of the new lower right corner
   */
  _fixedAspectRatio(newLowerRight, origin) {
    // calculate the aspect ratio of the original rectangle
    const aspectRatio = origin.width / origin.height
    // calculate the new width of the rectangle based on the new lower right corner position
    let newWidth = newLowerRight.x - origin.x
    // calculate the new height of the rectangle based on the aspect ratio
    let newHeight = newWidth / aspectRatio

    // check if the new height exceeds the height of the rectangle, if yes, adjust the height and width accordingly
    if (origin.y + newHeight > newLowerRight.y) {
      const heightExceed = newLowerRight.y - origin.y
      newHeight = heightExceed
      newWidth = heightExceed * aspectRatio
    }

    // calculate the new lower right corner position based on the new height and width
    const newLowerRightX = origin.x + newWidth
    const newLowerRightY = origin.y + newHeight

    return { x: newLowerRightX, y: newLowerRightY }
  }

  /**
   * Handle mouse-over event on a control handle
   * @param {PIXI.InteractionEvent} event   The mouseover event
   * @private
   */
  _onHoverIn(event) {
    const handle = event.target
    handle.scale.set(1.5, 1.5)
    event.data.handle = event.target
  }

  /**
   * Handle mouse-out event on a control handle
   * @param {PIXI.InteractionEvent} event   The mouseout event
   * @private
   */
  _onHoverOut(event) {
    event.data.handle.scale.set(1.0, 1.0)
  }

  /**
   * When we start a drag event - create a preview copy of the Tile for re-positioning
   * @param {PIXI.InteractionEvent} event   The mousedown event
   * @private
   */
  _onDragStart(event) {
    const hud = canvas.sceneweather.hud
    if (hud) hud.clear()

    if (!this.allControlledLocked) {
      this._dragHandle = true
      for (const weatherNode of canvas.sceneweather.controlled) {
        weatherNode._original = weatherNode.data.toObject()
      }
    }
    event.data.origin = this._getControlledBounds()
  }

  /**
   * Handle mousemove while dragging a tile scale handler
   * @param {PIXI.InteractionEvent} event   The mouse interaction event
   * @private
   */
  async _onDragMove(event) {
    // limit rate of interaction
    if (Utils.throttleInteractivity(this)) return

    let { destination, origin, originalEvent } = event.data

    // modifier for shiftKey locking the aspect ratio
    if (originalEvent.shiftKey) destination = this._fixedAspectRatio(destination, origin)

    // modifier for ctrlKey locking the snapping to grid
    if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey)
      destination = canvas.grid.getSnappedPosition(
        destination.x,
        destination.y,
        canvas.sceneweather.gridPrecision
      )

    // pan the canvas if the drag event approaches the edge
    canvas._onDragCanvasPan(originalEvent)

    // update all controlled WeatherNode's dimensions
    const borderPadding = canvas.dimensions.size * 0.5
    this._rescaleDimensions(
      origin,
      { x: destination.x - borderPadding, y: destination.y - borderPadding },
      originalEvent.altKey
    )
  }

  /**
   * Handle mouseup after dragging a tile scale handler
   * @param {PIXI.InteractionEvent} event   The mouseup event
   * @private
   */
  async _onDragEnd(event) {
    Logger.trace('WeatherNode._onDragEnd(...)')
    let { destination, origin, originalEvent } = event.data

    // modifier for shiftKey locking the aspect ratio
    if (originalEvent.shiftKey) destination = this._fixedAspectRatio(destination, origin)

    // modifier for ctrlKey locking the snapping to grid
    if (canvas.sceneweather.snapToGrid && !originalEvent.ctrlKey)
      destination = canvas.grid.getSnappedPosition(
        destination.x,
        destination.y,
        canvas.sceneweather.gridPrecision
      )

    const borderPadding = canvas.dimensions.size * 0.5
    this._rescaleDimensions(
      origin,
      { x: destination.x - borderPadding, y: destination.y - borderPadding },
      originalEvent.altKey
    )

    // finalize modification to all relevant weatherNodes
    const updatedWeatherNodes = canvas.sceneweather.controlled.map((weatherNode) => {
      if (weatherNode._original) {
        weatherNode.data.normalize()
        // weatherNode.refresh()
        const { _id, ...updates } = weatherNode.data.toObject()
        // reset the data, before finalizing via updateNodes function, so that we can store the original polygon's form in the history
        weatherNode._nodeData = new WeatherNodeData(weatherNode._original)
        delete weatherNode._original
        return { ...updates, id: weatherNode.id }
      }
    })
    await canvas.sceneweather.updateNodes(updatedWeatherNodes)
  }

  /**
   * Handle cancellation of a drag event for one of the resizing handles
   * @param {PointerEvent} event            The drag cancellation event
   * @private
   */
  _onDragCancel(event) {
    Logger.trace('WeatherNode._onDragCancel(...)')
    // RESET TO ORIGINAL this.document.updateSource(this._original);
    this._dragHandle = false
    // delete this._original
    for (const weatherNode of canvas.sceneweather.controlled) {
      delete weatherNode._original
    }
    this.refresh()
  }

  _onClickRight(event) {
    Logger.trace('NodeFrame._onClickRight(...)', { event: event })
    // TODO toggle to rotation mode... FEATURE, not implemented yet
  }
}

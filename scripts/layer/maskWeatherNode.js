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
import { WeatherNodeConfig } from './weatherNodeConfig.js'
import { WeatherNodeData } from './weatherNodeData.js'
import { BorderNodeHandle } from './borderNodeHandle.js'
import { BorderHandle } from './borderHandle.js'
import { PRECI_TYPE, AMBIENCE_TYPE, NODE_TYPE, CREATION_STATES, CLOUD_TYPE } from '../constants.js'
import { Meteo } from '../meteo.js'
import { AbstractWeatherNode } from './abstractWeatherNode.js'

/**
 * TODO
 */
export class MaskWeatherNode extends AbstractWeatherNode {
  /**
   * The container for all borderNodeHandles
   * Contains .handle, @type {array[BorderNodeHandle]}
   * @type {PIXI.Container}
   */
  _borderNodes

  /**
   * The container for all borderHandles
   * Contains .handle, @type {array[BorderHandle]}
   * @type {PIXI.Container}
   */
  _borders

  /**
   * Shadow of a potential new borderNodeHandle
   * @type {borderNodeHandle|undefined}
   */
  _shadowBorderNode

  /**
   * A mouse interaction manager instance which handles mouse workflows related to this object.
   * @type {MouseInteractionManager}
   */
  mouseInteractionManager = null

  constructor(nodeData) {
    super(nodeData)
    // Border handles
    this._borders = this.addChild(this._createBorderHandles())
    // BorderNode handles
    this._borderNodes = this.addChild(this._createBorderNodeHandles())
  }

  /*--------------------- Static --------------------- */

  /**
   * TODO
   */
  static createMaskNodeAt(origin) {
    Logger.trace('MaskWeatherNode.createMaskNodeAt(...)', { origin: origin })
    const nodeData = WeatherNodeData.newVolatileMaskAt(origin) // no id, not persistable
    return new MaskWeatherNode(nodeData)
  }

  /*--------------------- Private functions --------------------- */

  /** @inheritdoc */
  filterWeatherModel(incomingFilterModel, outsideWeatherModel) {
    if (this.data.type == NODE_TYPE.MASK) {
      return this._filterWeatherModelMask(incomingFilterModel, outsideWeatherModel)
    } else {
      return incomingFilterModel
    }
  }

  /** @inheritdoc */
  showConfigApp(event) {
    // if we are in creation of a new WeatherNode, ignore clicks
    if (canvas.sceneweather.createState > CREATION_STATES.NONE) return event
    const configApp =
      this.id in canvas.sceneweather.apps
        ? canvas.sceneweather.apps[this.id]
        : new WeatherNodeConfig(this)
    canvas.sceneweather.apps[this.id] = configApp
    if (configApp.rendered) {
      configApp.maximize()
      configApp.bringToTop()
    } else {
      configApp.render(true)
    }
  }

  /**
   * Destroys the context and graphic of this weatherNode and implementation specific context.
   */
  destroy() {
    // remove borders
    this._borderNodes.removeChildren()
    this.removeChild(this._borderNodes)
    // remove borderNodes
    this._borders.removeChildren()
    this.removeChild(this._borders)
    // remove potential shadow borderNode
    if (this._shadowBorderNode) {
      this.removeChild(this._shadowBorderNode)
      this._shadowBorderNode = null
    }
    super.destroy()
  }

  /**
   * Synchronize the appearance of this WeatherNode with the properties of
   * its represented WeatherNodeData.
   */
  refresh() {
    const { locked, borderNodes } = this.data
    if (
      this._borders.children.length != borderNodes.length ||
      this._borderNodes.children.length != borderNodes.length
    ) {
      // clear all borderNodeHandles and borderHandles
      this._clearBorderElements()
      // reassmeble all borderNodeHandles and borderHandles with new structure
      this._assembleBorderElements()
    }

    this.buttonMode = true

    if (this.controlled) {
      if (!locked) {
        this._refreshBorderNodes()
        this._refreshBorders()
      } else {
        this._borderNodes.visible = false
        this._borders.visible = false
      }
    } else {
      this._borderNodes.visible = false
      this._borders.visible = false
      if (this._shadowBorderNode) {
        this.removeChild(this._shadowBorderNode)
        this._shadowBorderNode = null
      }
    }

    super.refresh()
  }

  /** @inheritdoc */
  activateListeners() {
    const mgr = Utils.createInteractionManager(this, {
      hoverIn: this._onHoverIn,
      hoverOut: this._onHoverOut,
      clickLeft: this._onClickLeft,
      clickLeft2: this.showConfigApp,
      clickRight: this._onClickRight,
      clickRight2: this.showConfigApp,
      dragLeftStart: this._onDragLeftStart,
      dragLeftMove: this._onDragLeftMove,
      dragLeftDrop: this._onDragLeftDrop,
      dragLeftCancel: this._onDragLeftCancel,
      longPress: this._onLongPress
    })
    this.mouseInteractionManager = mgr.activate()

    // handlers for the border nodes
    for (const borderNodeHandle of this._borderNodes.handle) {
      borderNodeHandle.activateListeners()
    }
    this._borderNodes.interactive = true

    // handlers for the borders
    for (const borderHandle of this._borders.handle) {
      borderHandle.activateListeners()
    }
    this._borders.interactive = true
  }

  /** @inheritdoc */
  coversPoint(x, y) {
    if (this.data.type == NODE_TYPE.MASK) {
      const nx = this.data.x
      const ny = this.data.y
      const hitArea = new PIXI.Polygon(this.data.borderNodes.flatMap(({ x, y }) => [x, y]))
      const result = hitArea.contains(x - nx, y - ny)
      return result
    } else {
      return false
    }
  }

  /*--------------------- Functions, public, type specific --------------------- */

  addBorderNode(borderNodeNr, newPosition) {
    Logger.trace('WeatherNode.addBorderNode(...)', {
      borderNodeNr: borderNodeNr,
      newPosition: newPosition
    })

    this.data.borderNodes.splice(
      borderNodeNr + 1,
      0,
      WeatherNodeData.newDefaultBorderPointAt(newPosition)
    )
    const nodeToUpdate = {
      id: this.id,
      borderNodes: this.data.borderNodes
    }

    // Remove shadow
    if (this._shadowBorderNode) {
      this.removeChild(this._shadowBorderNode)
      this._shadowBorderNode = null
    }

    // Update this WeatherNode with the new borderNode
    canvas.sceneweather.updateNodes([nodeToUpdate])
  }

  _filterWeatherModelMask(incomingFilterModel, outsideWeatherModel) {
    switch (this.data.mask) {
      case AMBIENCE_TYPE.lightroof:
        return Utils.mergeObject(Utils.deepClone(outsideWeatherModel), {
          clouds: {
            coverage: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.coverage : 0,
            bottom: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.bottom : 0,
            top: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.top : 0,
            type: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.type : 0
          },
          precipitation: {
            amount: outsideWeatherModel.precipitation.amount * 0.5
          },
          sun: {
            amount: outsideWeatherModel.sun.amount * 0.5
          },
          condition: AMBIENCE_TYPE.lightroof
        })
      case AMBIENCE_TYPE.roof:
        return Utils.mergeObject(Utils.deepClone(outsideWeatherModel), {
          clouds: {
            coverage: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.coverage : 0,
            bottom: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.bottom : 0,
            top: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.top : 0,
            type: (outsideWeatherModel.clouds.type == CLOUD_TYPE.fog) ? outsideWeatherModel.clouds.type : 0
          },
          precipitation: {
            amount: 0,
            type: PRECI_TYPE.none
          },
          sun: {
            amount: 0
          },
          condition: AMBIENCE_TYPE.roof
        })
      case AMBIENCE_TYPE.inside:
        return Utils.mergeObject(Utils.deepClone(outsideWeatherModel), {
          clouds: {
            coverage: 0.0,
            bottom: 0,
            top: 0,
            type: CLOUD_TYPE.none
          },
          precipitation: {
            amount: 0,
            type: PRECI_TYPE.none
          },
          sun: {
            amount: 0
          },
          wind: {
            speed: 0,
            gusts: 0,
            direction: 0
          },
          temp: {
            air: outsideWeatherModel.temp.ground,
            percieved: outsideWeatherModel.temp.ground
          },
          humidity: Meteo.calculateRelativeHumidityTransfer(
            outsideWeatherModel.temp.air,
            outsideWeatherModel.humidity,
            outsideWeatherModel.temp.ground
          ),
          condition: AMBIENCE_TYPE.inside
        })
      case AMBIENCE_TYPE.underground:
        // const medianTemperature
        return Utils.mergeObject(Utils.deepClone(outsideWeatherModel), {
          clouds: {
            coverage: 0.0,
            bottom: 0,
            top: 0,
            type: CLOUD_TYPE.none
          },
          precipitation: {
            amount: 0,
            type: PRECI_TYPE.none
          },
          sun: {
            amount: 0
          },
          wind: {
            speed: 0,
            gusts: 0,
            direction: 0
          },
          temp: {
            ground: outsideWeatherModel.temp.underground,
            air: outsideWeatherModel.temp.underground,
            percieved: outsideWeatherModel.temp.underground
          },
          humidity: Meteo.calculateRelativeHumidityTransfer(
            outsideWeatherModel.temp.air,
            outsideWeatherModel.humidity,
            outsideWeatherModel.temp.underground
          ),
          condition: AMBIENCE_TYPE.underground
        })
      case AMBIENCE_TYPE.outside:
      default:
        return Utils.mergeObject(Utils.deepClone(outsideWeatherModel), {
          condition: AMBIENCE_TYPE.outside
        })
    }
  }

  _clearBorderElements() {
    // remove all old borderNodeHandles
    this._borderNodes.removeChildren()
    this._borderNodes.handle = []

    // remove all old borderHandles
    this._borders.removeChildren()
    this._borders.handle = []
  }

  // needs a .refresh() after calling
  _assembleBorderElements() {
    // add new created set of borderNodeHandles
    for (let i = 0; i < this.data.borderNodes.length; i++) {
      this._borderNodes.handle[i] = this._borderNodes.addChild(
        new BorderNodeHandle(this, { borderNodeNr: i })
      )
    }
    // apply action handlers to new borderNodeHandles
    for (const borderNodeHandle of this._borderNodes.handle) {
      borderNodeHandle.activateListeners()
    }

    // add new created set of borderHandles
    for (let i = 0; i < this.data.borderNodes.length; i++) {
      this._borders.handle[i] = this._borders.addChild(new BorderHandle(this, i))
    }
    // apply action handlers to new borderNodeHandles
    for (const borderHandle of this._borders.handle) {
      borderHandle.activateListeners()
    }
  }

  /**
   * Determines if a given point is inside the area defined by a 2D polygon.
   * @private
   * @param {{x: number, y: number}} point - An object containing the x and y coordinates of the point to test.
   * @param {{x: number, y: number}[]} polygon - An array of objects, where each object contains the x and y coordinates of a vertex of the polygon.
   * @returns {boolean} - `true` if the point is inside the polygon, `false` otherwise.
   */
  _insidePolygon(point) {
    const polygon = this.data.borderNodes
    return polygon.reduce((c, { x: xi, y: yi }, i, arr) => {
      const { x: xj, y: yj } = arr[(i + arr.length - 1) % arr.length]
      return yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
        ? !c
        : c
    }, false)
  }

  _createBorderNodeHandles() {
    const handles = new PIXI.Container()
    handles.handle = []
    for (let i = 0; i < this.data.borderNodes.length; i++) {
      handles.handle[i] = handles.addChild(new BorderNodeHandle(this, { borderNodeNr: i }))
    }
    return handles
  }

  _createBorderHandles() {
    const handles = new PIXI.Container()
    handles.handle = []
    for (let i = 0; i < this.data.borderNodes.length; i++) {
      handles.handle[i] = handles.addChild(new BorderHandle(this, i))
    }
    return handles
  }

  _refreshBorderNodes() {
    for (const borderNodeHandle of this._borderNodes.handle) {
      borderNodeHandle.refresh()
    }
    this._borderNodes.visible = true
  }

  _refreshBorders() {
    for (const borderHandle of this._borders.handle) {
      borderHandle.refresh()
    }
    this._borders.visible = true
  }

  _refreshShadowBorderNodeHandle() {
    Logger.trace('WeatherNode._refreshShadowBorderNodeHandle() SHALL BE DEPRECATED')
    if (this._shadowBorderNode) {
      //    this._shadowBorderNode.
    }
  }

  /*--------------------- Functions, Event Handling --------------------- */

  /** @inheritdoc */
  async creationDragLeftMove(creationState, position) {
    this.data.setLastBorderNode(position, canvas.dimensions.size * 0.5)
    this.data.normalize()
    await this.data.update()
    this.refresh()
    return creationState // CREATION_STATES.POTENTIAL
  }

  /** @inheritdoc */
  async creationDragLeftDrop(creationState, position) {
    this.data.addBorderNode(position, canvas.dimensions.size * 0.5)
    return creationState // CREATION_STATES.POTENTIAL or CREATION_STATES.CONFIRMED when borderNodes.length > 2
  }

  /** @inheritdoc */
  async creationClickLeft2(creationState, position) {
    // get data from preview containers node
    const nodeData = this.data.toObject()
    // remove last borderNode for duplicate
    nodeData.borderNodes.splice(-1, 1)

    await canvas.sceneweather.createWeatherNodes([nodeData], {
      control: true,
      controlOptions: { releaseOthers: true }
    })

    // end creation
    return CREATION_STATES.NONE
  }

  /** @inheritdoc */
  async _onShift(event) {
    const borderNode = this._borders.handle.find((borderNodeHandle) => {
      return borderNodeHandle.hover
    })
    if (borderNode) {
      const newNodePosition = borderNode.getNewNodePosition()
      if (this._shadowBorderNode) {
        this._shadowBorderNode.setPosition(newNodePosition)
      } else {
        this._shadowBorderNode = this.addChild(
          new BorderNodeHandle(null, {
            position: {
              x: newNodePosition.x,
              y: newNodePosition.y
            }
          })
        )
      }
      this._shadowBorderNode.refresh()
    } else {
      if (this._shadowBorderNode) {
        this.removeChild(this._shadowBorderNode)
        this._shadowBorderNode = null
      }
    }
  }

  /** @inheritdoc */
  async _onShiftRelease(event) {
    if (this._shadowBorderNode) {
      this.removeChild(this._shadowBorderNode)
      this._shadowBorderNode = null
    }
  }
}

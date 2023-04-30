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
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { NODE_TYPE, AMBIENCE_TYPE, AMBIENCE_MASK_COLOR } from '../constants.js'

/**
 * A class that creates a trackable array that can detect when it has been modified.
 * @class
 */
class TrackableArray {
  /**
   * Creates a new trackable array using a proxy.
   * @constructor
   * @param {Array} arr - The array to be tracked.
   */
  constructor(arr) {
    const self = this
    this.modified = false

    const handler = {
      /**
       * Sets a new value for the specified property in the target object.
       * @param {Object} target - The object being proxied.
       * @param {string|symbol} prop - The property name or symbol to be set.
       * @param {} value - The new value for the property.
       * @param {Object} receiver - The proxy or a derived object.
       * @returns {boolean} - True if the operation succeeded, false otherwise.
       */
      set(target, prop, value, receiver) {
        const oldValue = target[prop]
        if (value !== oldValue && !(Number.isNaN(value) && Number.isNaN(oldValue))) {
          if (typeof value === 'object' && value !== null) {
            value = new TrackableArray(value)
          }
          target[prop] = value
          self.modified = true
        }
        return true
      },
      /**
       * Removes a property from the target object.
       * @param {Object} target - The object being proxied.
       * @param {string|symbol} prop - The property name or symbol to be removed.
       * @returns {boolean} - True if the operation succeeded, false otherwise.
       */
      deleteProperty(target, prop) {
        if (prop in target) {
          delete target[prop]
          self.modified = true
        }
        return true
      },
      /**
       * Calls a function with a given this value and arguments.
       * @param {Function} target - The function being proxied.
       * @param {} thisArg - The value of this provided for the call to target.
       * @param {Array} args - An array of arguments to be passed to the target function.
       * @returns {} - The result of the function call.
       */
      apply(target, thisArg, args) {
        const method = args[0]
        if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(method)) {
          self.modified = true
        }
        return Reflect.apply(target, thisArg, args)
      },
      /**
       * Retrieves the value of a property from the target object.
       * @param {Object} target - The object being proxied.
       * @param {string|symbol} prop - The property name or symbol to be retrieved.
       * @param {Object} receiver - The proxy or a derived object.
       * @returns {*} - The value of the property.
       */
      get(target, prop, receiver) {
        if (prop === 'changed') {
          return () =>
            self.modified || target.some((item) => item instanceof TrackableArray && item.changed())
        }
        const value = Reflect.get(target, prop, receiver)
        if (typeof value === 'object' && value !== null) {
          return new TrackableArray(value)
        }
        return value
      }
    }

    return new Proxy(arr, handler)
  }
}

/**
 * Represents a node data object for weather in a Foundry VTT scene.
 * @class
 */
export class WeatherNodeData {
  /**
   * A default schema for the node data object.
   * @type {Object}
   */
  static defaultSchema = {
    type: 'number',
    initial: 0,
    validation: (value) => {
      return true
    }
  }

  /**
   * Metadata for the node data object's fields.
   * @type {Object}
   */
  static metadata = {
    x: {},
    y: {},
    z: {},
    width: {},
    height: {},
    borderNodes: { type: 'Array', initial: new TrackableArray([]) },
    locked: { type: 'boolean', initial: false },
    enabled: { type: 'boolean', initial: true },
    feather: {
      type: 'number',
      initial: 0,
      validation: (value) => {
        return Number.between(value, 0, 100, true)
      }
    },
    type: {
      initial: NODE_TYPE.MASK,
      validation: (value) => {
        return Number.between(value, 0, 1, true)
      }
    },
    mask: {
      initial: AMBIENCE_TYPE.outside,
      validation: (value) => {
        return Number.between(value, 0, 4, true)
      }
    }
  }

  /**
   * The underlying data object.
   * @type {Object}
   * @private
   */
  _source = {}

  /**
   * Whether the data has been persisted.
   * @type {boolean}
   * @private
   */
  _persisted = false

  /**
   * Creates a new instance of the `WeatherNodeData` class.
   * @constructor
   * @param {Object} source - The underlying data object.
   */
  constructor(source) {
    this._source = source

    // construct access to data layer
    Object.keys(this.constructor.metadata).forEach((fieldName) => {
      const meta = Utils.mergeObject(
        Utils.deepClone(this.constructor.defaultSchema),
        this.constructor.metadata[fieldName]
      )
      const type = meta.type
      Object.defineProperty(this, fieldName, {
        get() {
          return fieldName in this._source ? this._source[fieldName] : meta.initial
        },
        set(newValue) {
          if (getType(newValue) != type)
            throw new Error(
              'Invalid type [' +
                getType(newValue) +
                '] while trying to set field [' +
                fieldName +
                '] of type [' +
                meta.type +
                '].'
            )
          const sourceValue = fieldName in this._source ? this._source[fieldName] : meta.initial
          this._persisted = this._persisted && sourceValue == newValue
          this._source[fieldName] = newValue
        },
        enumerable: true,
        configurable: true
      })
    })
  }

  /*--------------------- Properties --------------------- */

  /**
   * Whether the data has been persisted.
   * @type {boolean}
   * @readonly
   */
  get persisted() {
    return this._persisted && this._source._id != ''
  }

  /**
   * The ID of the node data object. If the id is 'preview', the WeatherNodeData
   * can not be persisted and is considered to be volatile, until an id has been
   * properly assigned by using the create() builder function.
   * @type {string}
   * @readonly
   */
  get id() {
    return this._source._id || 'preview'
  }

  get maskColor() {
    return AMBIENCE_MASK_COLOR[this.mask] || AMBIENCE_MASK_COLOR[0]
  }

  /*--------------------- Static --------------------- */

  /**
   * Returns a default data object for the node.
   * @static
   * @returns {Object} - The default data object.
   */
  static defaultSource() {
    let defaultSource = {
      _id: ''
    }
    Object.keys(WeatherNodeData.metadata).forEach((fieldName) => {
      const meta = Utils.mergeObject(
        Utils.deepClone(WeatherNodeData.defaultSchema),
        WeatherNodeData.metadata[fieldName]
      )
      defaultSource[fieldName] = meta.initial
    })
    return defaultSource
  }

  static newDefaultBorderPointAt({ x = 0, y = 0, permeable = 0 } = {}) {
    return {
      x: x,
      y: y,
      permeable: permeable
    }
  }

  /**
   * Creates a new instance of the `WeatherNodeData` class and persists it to the database.
   * @static
   * @async
   * @param {Object} [data=null] - Data to initialize the new node data object with.
   * @param {boolean} [forceId=false] - Use supplied _id as as the data id, otherwise use a new random id.
   * @returns {WeatherNodeData} - The created node data object.
   */
  static async create(data = null, forceId = false) {
    const newId = forceId ? data._id : randomID()
    let newData = Utils.mergeObject(Utils.deepClone(WeatherNodeData.defaultSource()), {
      _id: newId
    })
    if (data) {
      delete data._id // remove foreign id when creating a new one
      newData = Utils.mergeObject(newData, data, { insertKeys: false, enforceTypes: true })
    }
    const created = new WeatherNodeData(newData)
    Logger.info(
      'Created WeatherNode with id [' + created.id + '] in parent Scene [' + Fal.getScene().id + ']'
    )
    await created.update()
    return created
  }

  /**
   * Creates a new volatile instance of the `WeatherNodeData` class for a mask at a given position.
   * @static
   * @param {Object} [options={x: 0, y: 0}] - Options for the mask.
   * @returns {WeatherNodeData} - The created volatile node data object.
   */
  static newVolatileMaskAt({ x = 0, y = 0 } = {}) {
    const newData = Utils.deepClone(WeatherNodeData.defaultSource())
    newData.borderNodes.push(
      WeatherNodeData.newDefaultBorderPointAt({ x: x, y: y }),
      WeatherNodeData.newDefaultBorderPointAt({ x: x, y: y })
    )
    return new WeatherNodeData(newData)
  }

  /**
   * Loads all node data objects from the database.
   * @static
   * @returns {WeatherNodeData[]} - An array of all node data objects.
   */
  static loadAll() {
    const docData = Fal.getSceneFlag('nodes', {})
    const allNodeDatas = Object.values(docData).map((data) => {
      return new WeatherNodeData(data)
    })
    return allNodeDatas
  }

  /**
   * Deletes all node data objects from the database.
   * @static
   * @async
   * @returns {string[]} - An array of deleted node IDs.
   */
  static async deleteAll() {
    const allNodeIds = Object.keys(Fal.getSceneFlag('nodes', {}))
    Logger.info('Deleted all WeatherNodes in parent Scene [' + Fal.getScene().id + ']')
    await Fal.unsetSceneFlag('nodes')
    return allNodeIds
  }

  /**
   * Loads a node data object by ID from the database.
   * @static
   * @param {string} id - The ID of the node to load.
   * @returns {WeatherNodeData|undefined} - The loaded node data object or undefined if it doesn't exist.
   */
  static load(id) {
    const docData = Fal.getSceneFlag('nodes', {})
    if (id in docData) {
      return new WeatherNodeData(docData[id])
    } else {
      return undefined
    }
  }

  /*--------------------- Functions, public --------------------- */

  /**
   * TODO
   */
  _isPolygonValid(minDistance) {
    const numNodes = this.borderNodes.length
    const segments = []
    for (let i = 0; i < numNodes; i++) {
      const p1 = this.borderNodes[i]
      const p2 = this.borderNodes[(i + 1) % numNodes]
      segments.push({ p1, p2 })
    }
    // check for line intersections
    if (numNodes > 3) {
      for (let i = 0; i < numNodes; i++) {
        const segment1 = segments[i]
        // precalculare indices to compare to avoid decisioning inside the inner loop
        const indicesToCompare = Array.from(
          { length: numNodes - 3 },
          (_, j) => (i + j + 2) % numNodes
        )
        for (let j = 0; j < indicesToCompare.length; j++) {
          const segment2 = segments[indicesToCompare[j]]
          if (this._doSegmentsIntersect(segment1.p1, segment1.p2, segment2.p1, segment2.p2)) {
            return false
          }
        }
      }
    }

    // check for distance between borderNodes and borderlines
    for (let pointNr = 0; pointNr < numNodes; pointNr++) {
      for (let segNr = 0; segNr < numNodes; segNr++) {
        const rightNeighbor = (segNr + 1) % numNodes
        const leftNeighbor = (pointNr - 1 + numNodes) % numNodes
        if (pointNr !== segNr && segNr !== leftNeighbor) {
          const segment = segments[segNr]
          const distance = this._pointToLineDistance(
            this.borderNodes[pointNr].x,
            this.borderNodes[pointNr].y,
            segment.p1.x,
            segment.p1.y,
            segment.p2.x,
            segment.p2.y
          )
          if (distance < minDistance) {
            return false
          }
        }
      }
    }
    return true
  }

  /**
   * TODO
   */
  _doSegmentsIntersect(p1, p2, q1, q2) {
    const dx1 = p2.x - p1.x
    const dy1 = p2.y - p1.y
    const dx2 = q2.x - q1.x
    const dy2 = q2.y - q1.y

    const delta = dx2 * dy1 - dy2 * dx1
    if (delta === 0) {
      return false // parallel or collinear segments
    }

    const s = (dx1 * (q1.y - p1.y) + dy1 * (p1.x - q1.x)) / delta
    const t = (dx2 * (p1.y - q1.y) + dy2 * (q1.x - p1.x)) / -delta
    return s >= 0 && s <= 1 && t >= 0 && t <= 1
  }

  /**
   * Calculates the minimum distance of a point from a line in all directions around the line itself.
   *
   * @param {number} x - The x-coordinate of the point.
   * @param {number} y - The y-coordinate of the point.
   * @param {number} x1 - The x-coordinate of the first endpoint of the line.
   * @param {number} y1 - The y-coordinate of the first endpoint of the line.
   * @param {number} x2 - The x-coordinate of the second endpoint of the line.
   * @param {number} y2 - The y-coordinate of the second endpoint of the line.
   * @returns {number} The minimum distance from the point to the line.
   */
  _pointToLineDistance(x, y, x1, y1, x2, y2) {
    // Calculate the vector between the two endpoints of the line.
    const dx = x2 - x1
    const dy = y2 - y1

    // Calculate the magnitude of the vector (the square of the length of the line).
    const mag = dx * dx + dy * dy

    // Calculate the position of the point along the line (u), using the dot product between the
    // vector from the first endpoint to the point and the line vector. We divide by the square
    // of the line length to get a value between 0 and 1 that represents the position of the
    // closest point on the line.
    const u = ((x - x1) * dx + (y - y1) * dy) / mag

    // Calculate the closest point on the line to the input point.
    let closestX, closestY
    if (u < 0) {
      // If u is less than 0, the closest point is the first endpoint of the line.
      closestX = x1
      closestY = y1
    } else if (u > 1) {
      // If u is greater than 1, the closest point is the second endpoint of the line.
      closestX = x2
      closestY = y2
    } else {
      // Otherwise, the closest point is the point on the line that corresponds to u.
      closestX = x1 + u * dx
      closestY = y1 + u * dy
    }

    // Calculate the vector from the closest point on the line to the input point.
    const dx2 = x - closestX
    const dy2 = y - closestY

    // Return the length of the vector as the distance between the point and the line.
    return Math.sqrt(dx2 * dx2 + dy2 * dy2)
  }

  /**
   * @returns true: borderNode was set, false: was not set
   */
  setLastBorderNode(position, minDistance) {
    return this.setBorderNode(position, minDistance, -1)
  }

  setBorderNode(position, minDistance = -1, nodeNr) {
    const oldX = this.borderNodes.at(nodeNr).x
    const oldY = this.borderNodes.at(nodeNr).y

    this.borderNodes.at(nodeNr).x = position.x - this.x
    this.borderNodes.at(nodeNr).y = position.y - this.y

    // force no test for validity
    if (minDistance == -1) return true
    // test for validity
    if (this._isPolygonValid(minDistance)) return true
    // revert position on fail
    Logger.debug('invalid polygon shape')
    this.borderNodes.at(nodeNr).x = oldX
    this.borderNodes.at(nodeNr).y = oldY
  }

  // canvas.dimensions.size * 0.5
  /**
   * @returns true: borderNode was added, false: was not added
   */
  addBorderNode(position, minDistance) {
    const goodPosition = this.borderNodes.at(-1)
    this.borderNodes.push({
      x: position.x - this.x,
      y: position.y - this.y,
      permeable: 0
    })
    if (this._isPolygonValid(minDistance)) return true
    Logger.debug('WeatherNodeData.addBorderNode(...)  -> invalid polygon', { position: position })
    this.borderNodes.at(-1).x = goodPosition.x
    this.borderNodes.at(-1).y = goodPosition.y
    return false
  }

  normalize(update = true) {
    // remove duplicate points, repeating in sequence.
    // only do so if the amount of borderNodes is larger then 2 ( at least complete face )
    // and not the last one, as this may be drag-created from next to last node
    if (this.borderNodes.length > 2) {
      const borderNodes = this.borderNodes.map((node) => {
        return { x: node.x, y: node.y }
      })
      for (let i = 0; i < borderNodes.length - 2; i++) {
        const nodeA = borderNodes[i]
        const nodeB = borderNodes[(i + 1) % borderNodes.length]
        if (nodeA.x === nodeB.x && nodeA.y === nodeB.y) {
          this.borderNodes.splice(i, 1)
        }
      }
    }

    const minX = this.borderNodes.reduce((smallest, current) => {
      return current.x < smallest ? current.x : smallest
    }, this.borderNodes[0].x)
    const minY = this.borderNodes.reduce((smallest, current) => {
      return current.y < smallest ? current.y : smallest
    }, this.borderNodes[0].y)
    const maxX = this.borderNodes.reduce((largest, current) => {
      return current.x > largest ? current.x : largest
    }, this.borderNodes[0].x)
    const maxY = this.borderNodes.reduce((largest, current) => {
      return current.y > largest ? current.y : largest
    }, this.borderNodes[0].y)

    // normalize points relative to minX and minY
    for (let i = 0; i < this.borderNodes.length; i++) {
      this.borderNodes[i].x = this.borderNodes[i].x - minX
      this.borderNodes[i].y = this.borderNodes[i].y - minY
    }

    // frame data
    this.x += minX
    this.y += minY
    this.width = maxX - minX
    this.height = maxY - minY

    if (update) this.update()
    return this
  }

  /**
   * TODO
   */
  dimensionsFrom(otherNodeData) {
    this.x = otherNodeData.x
    this.y = otherNodeData.y
    this.width = otherNodeData.width
    this.height = otherNodeData.height
  }

  /**
   * Deletes the node data object from the database.
   * @async
   * @returns {Promise<void>}
   */
  async delete() {
    if (this._source._id == '') return
    let nodes = Fal.getSceneFlag('nodes', {})
    if (this._source._id in nodes) {
      delete nodes[this._source._id]
      Logger.info(
        'Deleted WeatherNode with id [' +
          this._source._id +
          '] in parent Scene [' +
          Fal.getScene().id +
          ']'
      )
      await Fal.unsetSceneFlag('nodes')
      await Fal.setSceneFlag('nodes', nodes)
    }
    this._source._id = ''
    this._persisted = true
  }

  /**
   * Clones this instance of the WeatherNodeData object, also
   * removing the clones instace's id. So the clones one needs
   * to be either given a new id or considered volatile.
   * @returns {WeatherNodeData}
   */
  clone() {
    let clonedData = Utils.deepClone(this._source)
    clonedData._id = ''
    return new WeatherNodeData(clonedData)
  }

  /**
   * Returns an object representation of the underlying source
   * data of this instance.
   * @returns {object}
   */
  toObject() {
    return Utils.deepClone(this._source)
  }

  /**
   * Updates the node data object in the database.
   * @async
   * @returns {Promise<void>}
   */
  async update() {
    if (this.persisted) return
    if (this._source._id == '') {
      //Hooks.callAll(`updateWeatherNodeData`, { 'persisted': false, 'data': this })  // TODO module name
      return
    }
    let nodes = Fal.getSceneFlag('nodes', {})
    // CACHE let nodes = WeatherNodeData._nodesCache
    nodes[this._source._id] = this._source
    await Fal.setSceneFlag('nodes', nodes)
    this._persisted = true
    //Hooks.callAll(`updateWeatherNodeData`, { 'persisted': true, 'data': this })  // TODO module name
  }
}

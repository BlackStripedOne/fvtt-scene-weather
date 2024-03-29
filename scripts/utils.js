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

import { MODULE } from './constants.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'

/**
 * Foundry and console logging
 */
// eslint-disable-next-line unicorn/no-static-only-class
export class Logger {
  static info(message, notify = false) {
    if (notify) {
      ui.notifications.info(message)
    } else {
      console.log('%c' + MODULE.NAME + ' | ' + message, 'color: cornflowerblue;')
    }
  }

  static warn(message, notify = false, permanent = false) {
    if (notify) {
      ui.notifications.warn(message, { permanent: permanent })
    } else {
      console.error('%c' + MODULE.NAME + ' | ' + message, 'color: gold; background-color: darkgoldenrod;')
    }
  }

  static error(message, notify = false, permanent = false) {
    if (notify) {
      ui.notifications.error(message, { permanent: permanent })
    } else {
      console.error('%c' + MODULE.NAME + ' | ' + message, 'color: orangered; background-color: darkred;')
    }
  }

  static _dereferencer = {
    info: {
      debug: () => {},
      trace: () => {}
    },
    debug: {
      debug: Logger._debug,
      trace: () => {}
    },
    trace: {
      debug: Logger._debug,
      trace: Logger._trace
    }
  }

  static debug(message, data) {
    Logger._dereferencer[Fal.getSetting('loglevel', 'info')].debug(message, data)
  }

  static trace(message, data) {
    Logger._dereferencer[Fal.getSetting('loglevel', 'info')].trace(message, data)
  }

  static _debug(message, data) {
    if (data) {
      const dataClone = Utils.deepClone(data)
      console.log('%c' + MODULE.NAME + ' | ' + message, 'color: darkgrey;', dataClone)
    } else {
      console.log('%c' + MODULE.NAME + ' | ' + message, 'color: darkgrey;')
    }
  }

  static _trace(message, data) {
    if (data) {
      const dataClone = Utils.deepClone(data)
      console.log('%c' + MODULE.NAME + ' | ' + message, 'color: lime; background-color: darkgreen;', dataClone)
    } else {
      console.log('%c' + MODULE.NAME + ' | ' + message, 'color: lime; background-color: darkgreen;')
    }
  }
}

/**
 * Utilit class for generic fvtt ease-of-uses
 */
export const Utils = {
  getSplinePoints(pts, tension = 0.5, isClosed = false, numOfSegments = 16) {
    let _pts = [],
      res = [], // clone array
      x,
      y, // our x,y coords
      t1x,
      t2x,
      t1y,
      t2y, // tension vectors
      c1,
      c2,
      c3,
      c4, // cardinal points
      st // clone array so we don't change the original
    // eslint-disable-next-line unicorn/prefer-spread
    _pts = pts.slice(0)

    // The algorithm require a previous and next point to the actual point array.
    // Check if we will draw closed or open curve.
    // If closed, copy end points to beginning and first points to end
    // If open, duplicate first points to befinning, end points to end
    if (isClosed) {
      _pts.unshift(pts[pts.length - 1])
      _pts.unshift(pts[pts.length - 2])
      _pts.unshift(pts[pts.length - 1])
      _pts.unshift(pts[pts.length - 2])
      _pts.push(pts[0], pts[1])
    } else {
      _pts.unshift(pts[1]) //copy 1. point and insert at beginning
      _pts.unshift(pts[0])
      _pts.push(pts[pts.length - 2], pts[pts.length - 1])
    }

    // 1. loop goes through point array
    // 2. loop goes through each segment between the 2 pts + 1e point before and after
    for (let i = 2; i < _pts.length - 4; i += 2) {
      for (let t = 0; t <= numOfSegments; t++) {
        // calc tension vectors
        t1x = (_pts[i + 2] - _pts[i - 2]) * tension
        t2x = (_pts[i + 4] - _pts[i]) * tension

        t1y = (_pts[i + 3] - _pts[i - 1]) * tension
        t2y = (_pts[i + 5] - _pts[i + 1]) * tension

        // calc step
        st = t / numOfSegments

        // calc cardinals
        c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1
        c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2)
        c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st
        c4 = Math.pow(st, 3) - Math.pow(st, 2)

        // calc x and y cords with common control vectors
        x = c1 * _pts[i] + c2 * _pts[i + 2] + c3 * t1x + c4 * t2x
        y = c1 * _pts[i + 1] + c2 * _pts[i + 3] + c3 * t1y + c4 * t2y

        //store points in array
        res.push(x, y)
      }
    }
    return res
  },

  // eslint-disable-next-line unicorn/no-null
  getKeyByValue(obj, value, defaultValue = null) {
    const key = Object.keys(obj).find((key) => obj[key] === value)
    return key !== undefined ? key : defaultValue
  },

  /**
   * Returns the nested leaf of an object's tree denoted by a period-separated string.
   * @param {Object} obj - The object with nested objects.
   * @param {string} str - The period-separated string that denotes the path to the nested leaf.
   * @returns {*} The nested leaf of the object's tree that is denoted by the names in the string, or undefined if the path is not valid.
   */
  getNestedLeaf(obj, str) {
    if (!obj) return
    if (!str) return obj
    const keys = str.split('.')
    let value = obj

    for (let key of keys) {
      // eslint-disable-next-line no-prototype-builtins
      if (!value.hasOwnProperty(key)) {
        return
      }
      value = value[key]
    }

    return value
  },

  /**
   * Creates a MouseInteractionManager with the given parameters.
   * @param {Object} instance - The instance on which the interaction manager will be created.
   * @param {Object} handlers - The event handlers for the interaction manager. Must be an object with functions for each event type.
   * @param {Object} permissions - The permissions for each event handler. Must be an object with boolean values for each event type.
   * @param {HTMLElement|null} [target=null] - The HTML element to use as the target for the interaction manager. If not provided, the entire document will be used.
   * @returns {MouseInteractionManager} A MouseInteractionManager instance.
   * @example
   * const interactionManager = MouseInteractionManager.createInteractionManager(myInstance, {
   *  hoverIn: myHoverInHandler,
   *  hoverOut: myHoverOutHandler,
   *  clickLeft: myclickLeftHandler,
   *  clickLeft2: myclickLeft2Handler,
   *  clickRight: myRightClickHandler,
   *  clickRight2: myclickRight2Handler,
   *  dragLeftStart: myDragStartHandler,
   *  dragLeftMove: myDragMoveHandler,
   *  dragLeftDrop: myDragEndHandler,
   *  dragLeftCancel: myDragCancelHandler,
   *  dragRightStart: mydragRightStartHandler,
   *  dragRightMove: mydragRightMoveHandler,
   *  dragRightDrop: mydragRightDropHandler,
   *  dragRightCancel: mydragRightCancelHandler,
   *  longPress: mylongPressHandler,
   *  }, {
   *  hoverIn: true,
   *  ...
   *  longPress: () => { return true; }
   * });
   */
  // eslint-disable-next-line unicorn/no-null
  createInteractionManager(instance, handlers = {}, permissions = {}, target = null) {
    const options = { target: target }
    // merge manually set permissions with default perimssions for all given handlers
    permissions = Utils.mergeObject(
      Object.fromEntries(
        Object.keys(handlers)
          .filter((key) => typeof handlers[key] === 'function')
          .map((key) => [key, true])
      ),
      permissions
    )
    // Create the interaction manager
    return new MouseInteractionManager(instance, canvas.stage, permissions, handlers, options)
  },

  /**
   * Limits the rate of user interaction to a specific sample rate.
   * @param {Object} instance - The instance of the class where the method is called.
   * @returns {Boolean} - True if the rate of interaction is limited, False if not.
   */
  throttleInteractivity(instance) {
    // limit rate of interaction
    const sampleRate = Math.ceil(1000 / (canvas.app.ticker.maxFPS || 60))
    const last = instance._drawTime || 0
    const now = Date.now()
    if (now - last < sampleRate) {
      return true
    }
    instance['_drawTime'] = Date.now()
    return false
  },

  /**
   * Calculates a 32-bit hash from a given string.
   * @param {string} string - The input string to generate the hash from.
   * @returns {number} The 32-bit hash generated from the input string.
   */
  getSeedFromString(string) {
    let hash = 0
    if (string.length === 0) return hash
    for (let i = 0; i < string.length; i++) {
      const char = string.codePointAt(i)
      hash = (hash << 5) - hash + char
      hash = Math.trunc(hash) // Convert to 32bit integer
    }
    return Math.abs(hash)
  },

  /**
   * Test if two objects contain the same enumerable keys and values.
   * @param {object} a  The first object.
   * @param {object} b  The second object.
   * @returns {boolean}
   */
  objectsEqual(a, b) {
    if (a === undefined || b === undefined) return false
    // eslint-disable-next-line unicorn/no-null
    if (a == null || b == null) return a === b
    if (getType(a) !== 'Object' || getType(b) !== 'Object') return a === b
    if (Object.keys(a).length !== Object.keys(b).length) return false
    return Object.entries(a).every(([k, v0]) => {
      const v1 = b[k]
      const t0 = getType(v0)
      const t1 = getType(v1)
      if (t0 !== t1) return false
      if (v0?.equals instanceof Function) return v0.equals(v1)
      if (t0 === 'Object') return Utils.objectsEqual(v0, v1)
      return v0 === v1
    })
  },

  /**
   * Update a source object by replacing its keys and values with those from a target object.
   *
   * @param {object} original                           The initial object which should be updated with values from the
   *                                                    target
   * @param {object} [other={}]                         A new object whose values should replace those in the source
   * @param {object} [options={}]                       Additional options which configure the merge
   * @param {boolean} [options.insertKeys=true]         Control whether to insert new top-level objects into the resulting
   *                                                    structure which do not previously exist in the original object.
   * @param {boolean} [options.insertValues=true]       Control whether to insert new nested values into child objects in
   *                                                    the resulting structure which did not previously exist in the
   *                                                    original object.
   * @param {boolean} [options.overwrite=true]          Control whether to replace existing values in the source, or only
   *                                                    merge values which do not already exist in the original object.
   * @param {boolean} [options.recursive=true]          Control whether to merge inner-objects recursively (if true), or
   *                                                    whether to simply replace inner objects with a provided new value.
   * @param {boolean} [options.inplace=true]            Control whether to apply updates to the original object in-place
   *                                                    (if true), otherwise the original object is duplicated and the
   *                                                    copy is merged.
   * @param {boolean} [options.enforceTypes=false]      Control whether strict type checking requires that the value of a
   *                                                    key in the other object must match the data type in the original
   *                                                    data to be merged.
   * @param {boolean} [options.performDeletions=false]  Control whether to perform deletions on the original object if
   *                                                    deletion keys are present in the other object.
   * @param {boolean} [options.expand=true]            Control whether keys will be treated as flattened object keys when
   *                                                    they contain a colon. If true, they will be expanded into am object
   *                                                    hierarchy, otherwise will kept as they are.
   * @param {number} [_d=0]                             A privately used parameter to track recursion depth.
   * @returns {object}                                  The original source object including updated, inserted, or
   *                                                    overwritten records.
   *
   */
  mergeObject(
    original,
    other = {},
    {
      insertKeys = true,
      insertValues = true,
      overwrite = true,
      recursive = true,
      inplace = true,
      enforceTypes = false,
      performDeletions = false,
      expand = true
    } = {},
    _d = 0
  ) {
    other = other || {}
    if (!(original instanceof Object) || !(other instanceof Object)) {
      throw new Error('One of original or other are not Objects!')
    }
    const options = {
      insertKeys,
      insertValues,
      overwrite,
      recursive,
      inplace,
      enforceTypes,
      performDeletions,
      expand
    }
    // Special handling at depth 0
    if (_d === 0) {
      if (expand && Object.keys(other).some((k) => /\./.test(k))) other = Utils.expandObject(other)
      if (Object.keys(original).some((k) => /\./.test(k))) {
        const expanded = expand ? Utils.expandObject(original) : original
        if (inplace && expand) {
          for (const k of Object.keys(original)) delete original[k]
          Object.assign(original, expanded)
        } else original = expanded
      } else if (!inplace) original = Utils.deepClone(original)
    }
    // Iterate over the other object
    for (let k of Object.keys(other)) {
      const v = other[k]
      // eslint-disable-next-line no-prototype-builtins
      if (original.hasOwnProperty(k)) {
        Utils._mergeUpdate(original, k, v, options, _d + 1)
      } else {
        Utils._mergeInsert(original, k, v, options, _d + 1)
      }
    }
    return original
  },

  /**
   * A helper function for merging objects when the target key does not exist in the original
   * @private
   */
  _mergeInsert(original, k, v, { insertKeys, insertValues, performDeletions, expand } = {}, _d) {
    // Delete a key
    if (k.startsWith('-=') && performDeletions) {
      delete original[k.slice(2)]
      return
    }
    const canInsert = (_d <= 1 && insertKeys) || (_d > 1 && insertValues)
    if (!canInsert) return
    // Recursively create simple objects
    if (v?.constructor === Object) {
      original[k] = Utils.mergeObject({}, v, {
        insertKeys: true,
        inplace: true,
        performDeletions,
        expand
      })
      return
    }
    // Insert a key
    original[k] = v
  },

  /**
   * A helper function for merging objects when the target key exists in the original
   * @private
   */
  _mergeUpdate(original, k, v, { insertKeys, insertValues, enforceTypes, overwrite, recursive, performDeletions, expand } = {}, _d) {
    const x = original[k]
    const tv = getType(v)
    const tx = getType(x)
    // Recursively merge an inner object
    if (tv === 'Object' && tx === 'Object' && recursive) {
      return Utils.mergeObject(
        x,
        v,
        {
          insertKeys,
          insertValues,
          overwrite,
          enforceTypes,
          performDeletions,
          expand,
          inplace: true
        },
        _d
      )
    }
    // Overwrite an existing value
    if (overwrite) {
      if (tx !== 'undefined' && tv !== tx && enforceTypes) {
        throw new Error('Mismatched data types encountered during object merge.')
      }
      original[k] = v
    }
  },

  /**
   * Flatten a possibly multi-dimensional object to a one-dimensional one by converting all nested keys to dot notation
   * @param {object} obj        The object to flatten
   * @param {number} [_d=0]     Track the recursion depth to prevent overflow
   * @return {object}           A flattened object
   */
  flattenObject(obj, _d = 0) {
    // TODO use Fal?
    // eslint-disable-next-line no-undef
    return flattenObject(obj, _d)
  },

  /**
   * Expand a flattened object to be a standard nested Object by converting all dot-notation keys to inner objects.
   * @param {object} obj      The object to expand
   * @param {number} [_d=0]   Track the recursion depth to prevent overflow
   * @return {object}         An expanded object
   */
  expandObject(obj, _d = 0) {
    if (_d > 100) throw new Error('Maximum object expansion depth exceeded')

    // Recursive expansion function
    function _expand(value) {
      if (value instanceof Object) {
        // eslint-disable-next-line unicorn/no-array-callback-reference
        if (Array.isArray(value)) return value.map(_expand)
        else return Utils.expandObject(value, _d + 1)
      }
      return value
    }

    // Expand all object keys
    const expanded = {}
    for (let [k, v] of Object.entries(obj)) {
      Utils.setProperty(expanded, k, _expand(v))
    }
    return expanded
  },

  /**
   * A helper function which searches through an object to assign a value using a string key
   * This string key supports the notation a.b.c which would target object[a][b][c]
   * @param {object} object   The object to update
   * @param {string} key      The string key
   * @param {*} value         The value to be assigned
   * @return {boolean}        Whether the value was changed from its previous value
   */
  setProperty(object, key, value) {
    let target = object
    let changed = false

    // Convert the key to an object reference if it contains dot notation
    if (key.includes('.')) {
      let parts = key.split('.')
      key = parts.pop()
      target = parts.reduce((o, i) => {
        // eslint-disable-next-line no-prototype-builtins
        if (!o.hasOwnProperty(i)) o[i] = {}
        return o[i]
      }, object)
    }

    // Update the target
    if (target[key] !== value) {
      changed = true
      target[key] = value
    }

    // Return changed status
    return changed
  },

  /**
   * TODO
   *
   * @param {string} text
   */
  copyToClipboard(text = '') {
    let temp = $('<input>')
    $('body').append(temp)
    temp.val(text).select()
    document.execCommand('copy')
    temp.remove()
  },

  /**
   * Returns the next element in an array after the given current element. If the current element
   * is the last one in the array, the first element of the array is returned.
   *
   * @param {Array} arr - The array to search for the next element.
   * @param {*} currentElement - The current element to search for.
   * @returns {*} The next element in the array after the current element, or the first element
   * of the array if the current element is the last one in the array. If the array is empty or
   * the current element is not in the array, currentElement is returned.
   */
  arrayNext(arr = [], currentElement = '') {
    if (arr.length === 0) return currentElement
    const currentIndex = arr.indexOf(currentElement)
    return arr[(currentIndex + 1) % arr.length] || arr[0]
  },

  /**
   * Returns the previous element in an array before the given current element. If the current
   * element is the first one in the array, the last element of the array is returned.
   *
   * @param {Array} arr - The array to search for the previous element.
   * @param {*} currentElement - The current element to search for.
   * @returns {*} The previous element in the array before the current element, or the last element
   * of the array if the current element is the first one in the array. If the array is empty or
   * the current element is not in the array, currentElement is returned.
   */
  arrayPrev(arr = [], currentElement = '') {
    if (arr.length === 0) return currentElement
    const currentIndex = arr.indexOf(currentElement)
    return arr[(currentIndex + arr.length - 1) % arr.length] || arr[0]
  },

  /**
   * Clamps a number between a minimum and maximum value.
   *
   * @param {number} number - The number to clamp.
   * @param {number} min - The minimum value the number can be.
   * @param {number} max - The maximum value the number can be.
   * @returns {number} The clamped number.
   *
   */
  clamp(number, min, max) {
    // TODO Math.clamped ?
    return Math.min(Math.max(number, min), max)
  },

  /**
   * Maps a value from one range to another range.
   *
   * @param {number} inputValue - The value to map.
   * @param {number} inputMin - The minimum value of the current range.
   * @param {number} inputMax - The maximum value of the current range.
   * @param {number} outputMin - The minimum value of the target range.
   * @param {number} outputMax - The maximum value of the target range.
   * @returns {number} The mapped value.
   *
   * @example
   * const inputValue = 50
   * const inputMin = 0
   * const inputMax = 100
   * const outputMin = 0
   * const outputMax = 1
   * const mappedValue = map(current, inMin, inMax, outMin, outMax) // Returns 0.5
   */
  map(inputValue, inputMin, inputMax, outputMin, outputMax) {
    if (inputMin < inputMax) {
      inputValue = Math.max(Math.min(inputValue, inputMax), inputMin)
    } else {
      inputValue = Math.max(Math.min(inputValue, inputMin), inputMax)
    }
    const [inputRange, outputRange] = [inputMax - inputMin, outputMax - outputMin]
    return (inputValue - inputMin) * (outputRange / inputRange) + outputMin
    //const mapped = ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    //return Utils.clamp(mapped, outMin, outMax)
  },

  /**
   * Maps a numeric value between two ranges to a color value between two hexadecimal values.
   * @param {number} current - The numeric value to map.
   * @param {number} inMin - The minimum value of the input range.
   * @param {number} inMax - The maximum value of the input range.
   * @param {string} hexMin - The hexadecimal color value for the minimum output.
   * @param {string} hexMax - The hexadecimal color value for the maximum output.
   * @returns {string} - The hexadecimal color value that corresponds to the mapped value.
   */
  mapColorHex(current, inMin, inMax, hexMin, hexMax) {
    const { r: redMin, g: greenMin, b: blueMin } = foundry.utils.Color.from(hexMin)
    const { r: redMax, g: greenMax, b: blueMax } = foundry.utils.Color.from(hexMax)
    return foundry.utils.Color.fromRGB([
      Utils.map(current, inMin, inMax, redMin, redMax),
      Utils.map(current, inMin, inMax, greenMin, greenMax),
      Utils.map(current, inMin, inMax, blueMin, blueMax)
    ]).toString()
  },

  /**
   * Round a number to the given number of decimals.
   * @param {number} number   The number to round
   * @param {number} decimals The number of decimals to round to
   * @returns {number} The rounded result
   */
  roundToDecimals(number, decimals) {
    return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals)
  },

  /**
   * Omit a specific key from an object.
   * @param {object} object The object from which to omit
   * @param {string|number|symbol} key The key to omit
   * @returns {object} The object without the given key.
   */
  omit(object, key) {
    // eslint-disable-next-line no-unused-vars
    const { [key]: _omitted, ...rest } = object
    return rest
  },

  /**
   * Checks if a given bit in a given number is set.
   *
   * @param {number} num The number to check.
   * @param {number} bit The bit number to check (0-based index).
   * @returns {object} `true` if the specified bit is set, `false` otherwise.
   */
  isBitSet(num, bit) {
    return (num & (1 << bit)) !== 0
  },

  /**
   * Quickly clone a simple piece of data, returning a copy which can be mutated safely.
   * This method DOES support recursive data structures containing inner objects or arrays.
   * This method DOES NOT support advanced object types like Set, Map, or other specialized classes.
   * @param {*} original                     Some sort of data
   * @param {object} [options]               Options to configure the behaviour of deepClone
   * @param {boolean} [options.strict=false] Throw an Error if deepClone is unable to clone something instead of returning the original
   * @return {*}                             The clone of that data
   */
  deepClone(original, { strict = false } = {}) {
    // Simple types
    if (typeof original !== 'object' || original === null) return original

    // Arrays
    // eslint-disable-next-line unicorn/no-array-callback-reference
    if (Array.isArray(original)) return original.map(Utils.deepClone)

    // Dates
    if (original instanceof Date) return new Date(original)

    // Unsupported advanced objects
    if (original.constructor && original.constructor !== Object) {
      if (strict) throw new Error('deepClone cannot clone advanced objects')
      return original
    }

    // Other objects
    const clone = {}
    for (let k of Object.keys(original)) {
      clone[k] = Utils.deepClone(original[k])
    }
    return clone
  }
}

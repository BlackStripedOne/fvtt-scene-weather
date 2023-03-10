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

import { MODULE } from './constants.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'

/**
 * Console logger
 */
export class Logger {
  static info(message, notify = false) {
    console.log(MODULE.NAME + ` Info | ${message}`)
    if (notify) ui.notifications.info(MODULE.NAME + ` | ${message}`)
  }

  static error(message, notify = false, permanent = false) {
    console.error(MODULE.NAME + ` Error | ${message}`)
    if (notify) ui.notifications.error(MODULE.NAME + ` | ${message}`, { 'permanent': permanent })
  }

  static debug(message, data) {
    if (Fal.getSetting('debug', false)) {
      if (!data) {
        console.log(MODULE.NAME + ` Debug | ${message}`)
        return
      }
      const dataClone = Utils.deepClone(data)
      console.log(MODULE.NAME + ` Debug | ${message}`, dataClone)
    }
  }
}

/**
 * Utilit class for generic fvtt ease-of-uses
 */
export class Utils {

  /**
  * Test if two objects contain the same enumerable keys and values.
  * @param {object} a  The first object.
  * @param {object} b  The second object.
  * @returns {boolean}
  */
  static objectsEqual(a, b) {
    if (a === undefined || b === undefined) return false
    if ((a == null) || (b == null)) return a === b
    if ((getType(a) !== "Object") || (getType(b) !== "Object")) return a === b
    if (Object.keys(a).length !== Object.keys(b).length) return false
    return Object.entries(a).every(([k, v0]) => {
      const v1 = b[k]
      const t0 = getType(v0)
      const t1 = getType(v1)
      if (t0 !== t1) return false
      if (v0?.equals instanceof Function) return v0.equals(v1)
      if (t0 === "Object") return Utils.objectsEqual(v0, v1)
      return v0 === v1
    })
  }

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
  static mergeObject(original, other = {}, {
    insertKeys = true, insertValues = true, overwrite = true, recursive = true, inplace = true, enforceTypes = false,
    performDeletions = false, expand = true
  } = {}, _d = 0) {
    other = other || {}
    if (!(original instanceof Object) || !(other instanceof Object)) {
      throw new Error("One of original or other are not Objects!")
    }
    const options = { insertKeys, insertValues, overwrite, recursive, inplace, enforceTypes, performDeletions, expand }
    // Special handling at depth 0
    if (_d === 0) {
      if (expand && Object.keys(other).some(k => /\./.test(k))) other = expandObject(other) // TODO Utils.expandObject
      if (Object.keys(original).some(k => /\./.test(k))) {
        const expanded = (expand) ? expandObject(original) : original  // TODO Utils.expandObject
        if (inplace && expand) {
          Object.keys(original).forEach(k => delete original[k])
          Object.assign(original, expanded)
        }
        else original = expanded
      }
      else if (!inplace) original = Utils.deepClone(original)
    }
    // Iterate over the other object
    for (let k of Object.keys(other)) {
      const v = other[k]
      if (original.hasOwnProperty(k)) {
        Utils._mergeUpdate(original, k, v, options, _d + 1)
      } else {
        Utils._mergeInsert(original, k, v, options, _d + 1)
      }
    }
    return original
  }

  /**
   * A helper function for merging objects when the target key does not exist in the original
   * @private
   */
  static _mergeInsert(original, k, v, { insertKeys, insertValues, performDeletions, expand } = {}, _d) {
    // Delete a key
    if (k.startsWith("-=") && performDeletions) {
      delete original[k.slice(2)]
      return
    }
    const canInsert = ((_d <= 1) && insertKeys) || ((_d > 1) && insertValues)
    if (!canInsert) return
    // Recursively create simple objects
    if (v?.constructor === Object) {
      original[k] = Utils.mergeObject({}, v, { insertKeys: true, inplace: true, performDeletions, expand })
      return
    }
    // Insert a key
    original[k] = v
  }

  /**
   * A helper function for merging objects when the target key exists in the original
   * @private
   */
  static _mergeUpdate(original, k, v, {
    insertKeys, insertValues, enforceTypes, overwrite, recursive, performDeletions, expand
  } = {}, _d) {
    const x = original[k]
    const tv = getType(v)
    const tx = getType(x)
    // Recursively merge an inner object
    if ((tv === "Object") && (tx === "Object") && recursive) {
      return Utils.mergeObject(x, v, {
        insertKeys, insertValues, overwrite, enforceTypes, performDeletions, expand,
        inplace: true
      }, _d)
    }
    // Overwrite an existing value
    if (overwrite) {
      if ((tx !== "undefined") && (tv !== tx) && enforceTypes) {
        throw new Error(`Mismatched data types encountered during object merge.`)
      }
      original[k] = v
    }
  }

  /**
   * Flatten a possibly multi-dimensional object to a one-dimensional one by converting all nested keys to dot notation
   * @param {object} obj        The object to flatten
   * @param {number} [_d=0]     Track the recursion depth to prevent overflow
   * @return {object}           A flattened object
   */
  static flattenObject(obj, _d = 0) {
    return flattenObject(obj, _d)
  }

  /**
   * TODO
   * 
   * @param {string} text 
   */
  static copyToClipboard(text = '') {
    let temp = $('<input>')
    $('body').append(temp)
    temp.val(text).select()
    document.execCommand('copy')
    temp.remove()
  }

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
  static arrayNext(arr = [], currentElement = '') {
    if (!arr.length) return currentElement
    const currentIndex = arr.indexOf(currentElement)
    return arr[(currentIndex + 1) % arr.length] || arr[0]
  }

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
  static arrayPrev(arr = [], currentElement = '') {
    if (!arr.length) return currentElement
    const currentIndex = arr.indexOf(currentElement)
    return arr[(currentIndex + arr.length - 1) % arr.length] || arr[0]
  }

  /**
   * Clamps a number between a minimum and maximum value.
   * 
   * @param {number} number - The number to clamp.
   * @param {number} min - The minimum value the number can be.
   * @param {number} max - The maximum value the number can be.
   * @returns {number} The clamped number.
   * 
   */
  static clamp(number, min, max) {
    return Math.min(Math.max(number, min), max)
  }

  /**
   * Maps a value from one range to another range.
   * 
   * @param {number} current - The value to map.
   * @param {number} inMin - The minimum value of the current range.
   * @param {number} inMax - The maximum value of the current range.
   * @param {number} outMin - The minimum value of the target range.
   * @param {number} outMax - The maximum value of the target range.
   * @returns {number} The mapped value.
   * 
   * @example
   * const current = 50
   * const inMin = 0
   * const inMax = 100
   * const outMin = 0
   * const outMax = 1
   * const mappedValue = map(current, inMin, inMax, outMin, outMax) // Returns 0.5
   */
  static map(current, inMin, inMax, outMin, outMax) {
    const mapped = ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    return Utils.clamp(mapped, outMin, outMax)
  }

  /**
   * Maps a numeric value between two ranges to a color value between two hexadecimal values.
   * @param {number} current - The numeric value to map.
   * @param {number} inMin - The minimum value of the input range.
   * @param {number} inMax - The maximum value of the input range.
   * @param {string} hexMin - The hexadecimal color value for the minimum output.
   * @param {string} hexMax - The hexadecimal color value for the maximum output.
   * @returns {string} - The hexadecimal color value that corresponds to the mapped value.
*/
  static mapColorHex(current, inMin, inMax, hexMin, hexMax) {
    const { r: redMin, g: greenMin, b: blueMin } = foundry.utils.Color.from(hexMin)
    const { r: redMax, g: greenMax, b: blueMax } = foundry.utils.Color.from(hexMax)
    return foundry.utils.Color.fromRGB([
      Utils.map(current, inMin, inMax, redMin, redMax),
      Utils.map(current, inMin, inMax, greenMin, greenMax),
      Utils.map(current, inMin, inMax, blueMin, blueMax)
    ]).toString()
  }

  /**
   * Round a number to the given number of decimals.
   * @param {number} number   The number to round
   * @param {number} decimals The number of decimals to round to
   * @returns {number} The rounded result
   */
  static roundToDecimals(number, decimals) {
    return Number(Math.round(number + "e" + decimals) + "e-" + decimals)
  }

  /**
   * Omit a specific key from an object.
   * @param {object} object The object from which to omit
   * @param {string|number|symbol} key The key to omit
   * @returns {object} The object without the given key.
   */
  static omit(object, key) {
    const { [key]: _omitted, ...rest } = object
    return rest
  }

  /**
   * Checks if a given bit in a given number is set.
   * 
   * @param {number} num The number to check.
   * @param {number} bit The bit number to check (0-based index).
   * @returns {object} `true` if the specified bit is set, `false` otherwise.
   */
  static isBitSet(num, bit) {
    return (num & (1 << bit)) !== 0
  }


  /**
   * Foundry VTT's deepClone function wrapped here to avoid code error highlighting due to missing definition.
   * 
   * @param {*} original
   * @param {*} options
   */
  static deepClone(original, options) {
    // eslint-disable-next-line no-undef
    return deepClone(original, options)
  }

}

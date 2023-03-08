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
   * TODO
   * 
   * @param {*} objectA 
   * @param {*} objectB 
   * @returns 
   */
  static objectsEqual(objectA, objectB) {
    return foundry.utils.objectsEqual(objectA, objectB)
  }

  /**
   * TODO
   * 
   * @param {*} original 
   * @param {*} other 
   * @param {*} options 
   * @param {*} _d 
   * @returns 
   */
  static mergeObject(original, other = {}, options = {}, _d = 0) {
    return foundry.utils.mergeObject(original, other, options, _d)
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
   * const current = 50;
   * const inMin = 0;
   * const inMax = 100;
   * const outMin = 0;
   * const outMax = 1;
   * const mappedValue = map(current, inMin, inMax, outMin, outMax); // Returns 0.5
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
    return Number(Math.round(number + "e" + decimals) + "e-" + decimals);
  }

  /**
   * Omit a specific key from an object.
   * @param {object} object The object from which to omit
   * @param {string|number|symbol} key The key to omit
   * @returns {object} The object without the given key.
   */
  static omit(object, key) {
    const { [key]: _omitted, ...rest } = object;
    return rest;
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
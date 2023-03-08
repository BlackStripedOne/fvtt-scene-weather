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

import { Utils } from '../utils.js'

export class ColorFilter extends PIXI.filters.AdjustmentFilter {

  /**
   * Create a color adjustment filter based on the PIXI AdjustmentFilter
   * @see https://api.pixijs.io/@pixi/core/PIXI/Filter.html
   * 
   * @param {object} optional parameters to overwrite and configure the filter
   */
  constructor({ options = {}, soft = false } = {}) {
    super()
    const { color, ...otherOptions } = Utils.mergeObject({
      tint: '#ffffff',
      saturation: 1,
      gamma: 1,
      brightness: 1,
      contrast: 1
    }, options)
    const { r: red, g: green, b: blue } = foundry.utils.Color.from(options.tint)
    const newOptions = { ...otherOptions, red, green, blue }
    const keys = Object.keys(newOptions)
    for (const key of keys) {
      this.optionContext[key] = newOptions[key]
    }
    this.enabled = true
  }

  /**
   * The context on which options should be applied.
   */
  get optionContext() {
    return this
  }

  /**
   * Stop and destroy this filter.  
   */
  async destroy() {
    this.enabled = false
    return true
  }

  /**
   * No animation for this filter
   */
  async step() { }
}

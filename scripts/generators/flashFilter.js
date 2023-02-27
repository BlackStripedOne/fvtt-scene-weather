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

import { MODULE } from '../constants.js'

export class FlashFilter extends PIXI.filters.AdjustmentFilter {

  /**
   * The options for this filter instance
   */
  options

  /**
   * Create a color adjustment filter based on the PIXI AdjustmentFilter
   * @see https://api.pixijs.io/@pixi/core/PIXI/Filter.html
   * 
   * @param {object} optional parameters to overwrite and configure the filter
   */
  constructor({ options = {}, soft = false } = {}) {
    super()
    this.options = foundry.utils.mergeObject({
      frequency: 0,
      duration: 0,
      brightness: 1,
      nextTime: canvas.app.ticker.lastTime / 10
    }, options)
    const keys = Object.keys(this.options)
    for (const key of keys) {
      this.optionContext[key] = this.options[key]
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
  async discard() {
    this.enabled = false
    return true
  }

  /**
   * Process next animation step. Invoked by the ticker.
   */
  async step() {
    if (canvas.app.ticker.lastTime / 10 > this.options.nextTime) {
      this.options.nextTime = canvas.app.ticker.lastTime / 10 + 40 + this.options.frequency * Math.random()

      const animate = (value) => {
        const attributes = [
          {
            parent: this,
            attribute: 'brightness',
            to: value
          }
        ]
        return CanvasAnimation.animate(attributes, {
          name: MODULE.ID + `.${this.constructor.name}.${randomID()}`,
          context: this,
          duration: 100 + this.options.duration * Math.random(),
          easing: function (x) {
            const c1 = 1.70158
            const c2 = c1 * 1.525
            return x < 0.5
              ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
              : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2
          }
        })
      }
      await animate(this.options.brightness)
      await animate(1)
    }
  }
}

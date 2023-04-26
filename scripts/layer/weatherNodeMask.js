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

import { NODE_TYPE } from '../constants.js'

/**
 * A special subclass of PIXI.Graphics used to represent a WeatherNode in the WeatherNodeLayer as well as the SceneWeatherEffects layer mask.
 */
export class WeatherNodeMask extends PIXI.Graphics {

  /**
   * @type {WeatherNodeData}
   */
  _weatherNodeData

  constructor(weatherNodeData) {
    super()
    this._weatherNodeData = weatherNodeData
  }

  // match to AMBIENCE_TYPE.*
  static maskColors = {
    0: 0xff0000, // outside
    1: 0x800000, // lightroof
    2: 0x000000, // roof
    3: 0x000000, // inside
    4: 0x000000  // underground
  }

  /**
   * Actually draw the appearance of the underlaying WeatherNodeData based on its settings.     
   * Call only once
   */
  draw() {
    const { x, y, borderNodes, mask, type, enabled, feather } = this._weatherNodeData
    if (type != NODE_TYPE.MASK) return
    if (!enabled) return
    const maskColor = WeatherNodeMask.maskColors[mask] || 0x000000
    this.clear()
      .beginFill(maskColor)
      .moveTo(x + borderNodes[0].x, y + borderNodes[0].y)
    for (let i = 0; i < borderNodes.length; i++) {
      // const p1 = borderNodes[i]
      const p2 = borderNodes[(i + 1) % borderNodes.length]
      this.lineTo(x + p2.x, y + p2.y)
    }
    this.endFill()
    // optionally apply feathering
    if (feather) {
      const blurSize = canvas.dimensions.size * (feather / 100)
      this.filters = [new PIXI.filters.BlurFilter(blurSize, blurSize / 10)]
    }
  }

}

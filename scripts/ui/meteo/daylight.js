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

import { MeteoContainer } from './meteoContainer.js'

/**
 * Represents a canvas for displaying the brightness of the say, depending on the day/night cycle.
 * @extends MeteoContainer
 */
export class MeteoDaylight extends MeteoContainer {
  skyColors = [
    0x000066, 0x03086e, 0x050f75, 0x08177d, 0x0a1f85, 0x0d268c, 0x0f2e94, 0x12369c, 0x143da3, 0x1745ab, 0x1a4cb2, 0x1c54ba, 0x1f5cc2, 0x2163c9, 0x246bd1,
    0x2673d9, 0x297ae0, 0x2b82e8, 0x2e8af0, 0x3091f7, 0x3399ff
  ]
  /** @override */
  _init() {
    this.filters = [new PIXI.filters.BlurFilter(16, 5)]
  }
  /** @override */
  update(graphData, __hourFrom, __hourTo) {
    this._graphics.clear()
    const barWidth = (graphData[2].xPos - graphData[1].xPos) / 2
    for (const data of graphData) {
      this._graphics.beginFill(this.skyColors[Math.round((this.skyColors.length - 1) * data.weatherModel.sun.available)], 1.0)
      this._graphics.drawRect(data.xPos - barWidth, 0, barWidth * 2, this._height)
    }
  }
}

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
 * Represents a canvas for displaying meteorological data.
 * @extends MeteoContainer
 */
export class MeteoCanvas extends MeteoContainer {
  /** @override */
  update(graphData) {
    this._graphics.clear()
    this._graphics.lineStyle(2, MeteoContainer.colors.bounds)
    this._graphics.drawRect(0, 0, this._width, this._height)
    for (const data of graphData) {
      if (data.isDayLine) {
        this._graphics.lineStyle(1, MeteoContainer.colors.dayLine)
        this._graphics.moveTo(data.xPos, 0)
        this._graphics.lineTo(data.xPos, this._height)
      } else if (data.isHourLine) {
        this._graphics.lineStyle(1, MeteoContainer.colors.hourLine)
        this._graphics.moveTo(data.xPos, 0)
        this._graphics.lineTo(data.xPos, this._height)
      }
    }
  }
}

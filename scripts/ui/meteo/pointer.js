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

import { TimeProvider } from '../../time/timeProvider.js'
import { MeteoContainer } from './meteoContainer.js'

/**
 * Represents a canvas for displaying the current point in time as a vertical line
 * @extends MeteoContainer
 */
export class MeteoPointer extends MeteoContainer {
  update(__graphData, hourFrom, hourTo) {
    const hourWidth = this._width / (-hourFrom + hourTo)
    const xPos = hourWidth * -hourFrom + hourWidth * TimeProvider.getHourFraction()

    this._graphics.clear()
    this._graphics.lineStyle(2, MeteoContainer.colors.bounds)
    this._graphics.moveTo(xPos, 0)
    this._graphics.lineTo(xPos, this._height)
  }
}

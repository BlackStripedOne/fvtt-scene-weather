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
import { MODULE } from '../../constants.js'
import { Utils } from '../../utils.js'

/**
 * Represents a canvas for drawing the wind direction and intensity via a relatively transparent arrow.
 * @extends MeteoContainer
 */
export class MeteoWind extends MeteoContainer {
  /** @override */
  _init() {
    this.removeChild(this._graphics)
    this.filters = [
      new PIXI.filters.DropShadowFilter({
        rotation: 90,
        distance: 2,
        color: 0x000000,
        alpha: 0.4,
        shadowOnly: false,
        blur: 0,
        quality: 0
      })
    ]
  }

  /** @override */
  update(graphData, __hourFrom, __hourTo) {
    this.removeChildren()
    for (let i = 1; i < graphData.length - 1; i++) {
      const { xPos, weatherModel } = graphData[i]
      this.addChild(this._getDirIcon(xPos, this._height / 2, weatherModel.wind.direction, weatherModel.wind.speed))
    }
  }

  /**
   * Generates a directional icon representing wind direction.
   * @param {number} x - The x-coordinate of the icon's position.
   * @param {number} y - The y-coordinate of the icon's position.
   * @param {number} direction - The direction of the wind in radians.
   * @param {number} speed - The speed of the wind.
   * @returns {PIXI.Sprite} - The generated directional icon.
   */
  _getDirIcon(x, y, direction, speed) {
    // create the icon
    const icon = PIXI.Sprite.from('modules/' + MODULE.ID + '/assets/wind-direction.svg')
    icon.width = icon.height = this._height
    // rotate the icon
    const iconAngle = -Math.PI / 2
    icon.anchor.set(0.5, 0.5)
    icon.rotation = iconAngle + direction
    icon.position.set(x, y)
    icon.visible = true
    icon.alpha = Utils.map(speed, 0, 80, 0.0, 1.0)
    return icon
  }
}

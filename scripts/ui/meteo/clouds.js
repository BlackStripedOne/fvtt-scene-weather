/* eslint-disable unicorn/number-literal-case */
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

import { Utils } from '../../utils.js'
import { MeteoContainer } from './meteoContainer.js'
import { CLOUD_TYPE } from '../../constants.js'

/**
 * Represents a canvas for displaying the cloud layer heights as well as cloud types visually
 * @extends MeteoContainer
 */
export class MeteoClouds extends MeteoContainer {
  /** @override */
  _init() {
    this.filters = [
      new PIXI.filters.BlurFilter(16, 5),
      new PIXI.filters.DropShadowFilter({
        rotation: 90,
        distance: 14,
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
    this._graphics.clear()

    let lastTop = Utils.map(graphData[0].weatherModel.clouds.top * 1.2, 10000, 0, 0, this._height)
    let lastBottom = Utils.map(graphData[0].weatherModel.clouds.bottom, 10000, 0, 0, this._height)
    let lastXPos = graphData[0].xPos

    for (const data of graphData) {
      const top = Utils.map(data.weatherModel.clouds.top * 1.2, 10000, 0, 0, this._height)
      const bottom = Utils.map(data.weatherModel.clouds.bottom, 10000, 0, 0, this._height)
      const xPos = data.xPos

      switch (data.weatherModel.clouds.type) {
        case CLOUD_TYPE.none:
          break
        case CLOUD_TYPE.fog:
          this._graphics.beginFill(0xffffff, Utils.map(data.weatherModel.clouds.coverage, 0.2, 1.0, 0.0, 0.4))
          this._graphics.drawPolygon(lastXPos, lastTop, xPos, top, xPos, bottom, lastXPos, lastBottom)
          this._graphics.endFill()
          break
        case CLOUD_TYPE.stratus:
          this._graphics.beginFill(0xffffff, Utils.map(data.weatherModel.clouds.coverage, 0.3, 1.0, 0.0, 0.6))
          this._graphics.drawPolygon(lastXPos, lastTop, xPos, top, xPos, bottom, lastXPos, lastBottom)
          this._graphics.endFill()
          // upper fakes
          this._graphics.beginFill(0xffffff, Utils.map(data.weatherModel.clouds.coverage, 0.5, 1.0, 0.0, 0.4))
          this._graphics.drawPolygon(
            lastXPos,
            lastTop * data.weatherModel.clouds.coverage * 0.5,
            xPos,
            top * data.weatherModel.clouds.coverage * 0.5,
            xPos,
            bottom * 0.4,
            lastXPos,
            lastBottom * 0.4
          )
          this._graphics.endFill()
          break
        case CLOUD_TYPE.cumulus:
          this._graphics.beginFill(0xdddddd, Utils.map(data.weatherModel.clouds.coverage, 0.4, 1.0, 0.0, 0.9))
          this._graphics.drawPolygon(lastXPos, lastTop, xPos, top, xPos, bottom, lastXPos, lastBottom)
          this._graphics.endFill()
          break
        case CLOUD_TYPE.cumulunimbus:
          this._graphics.beginFill(0xdddddd, Utils.map(data.weatherModel.clouds.coverage, 0.5, 1.0, 0.0, 0.9))
          this._graphics.drawPolygon(lastXPos, lastTop, xPos, top, xPos, bottom, lastXPos, lastBottom)
          this._graphics.endFill()
          // shadow
          this._graphics.beginFill(0x888888, Utils.map(data.weatherModel.clouds.coverage, 0.5, 1.0, 0.0, 0.9))
          this._graphics.drawPolygon(lastXPos, lastBottom - 50, xPos, bottom - 50, xPos, bottom, lastXPos, lastBottom)
          this._graphics.endFill()
          break
      }
      lastTop = top
      lastBottom = bottom
      lastXPos = xPos
    }
  }
}

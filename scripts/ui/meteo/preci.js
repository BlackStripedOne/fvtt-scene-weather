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
import { MODULE, CLOUD_TYPE, PRECI_TYPE } from '../../constants.js'

/**
 * Represents a canvas for displaying information about the precipittion amount and type as well as the sunshine amount visually.
 * @extends MeteoContainer
 */
export class MeteoPreci extends MeteoContainer {
  /**
   * Holds the PIXI.Sprite objects for displaying precipitation types.
   * @type{Array[@PIXI.Sprite]}
   */
  _icons = []

  /** @override */
  update(graphData, __hourFrom, __hourTo) {
    this._graphics.clear()
    // fill background
    this._graphics.beginFill(MeteoContainer.colors.preciBgColor)
    this._graphics.drawRect(0, 0, this._width, this._height)
    this._graphics.endFill()
    for (const icon of this._icons) {
      this.removeChild(icon)
    }
    this._icons = []
    const barWidth = (graphData[2].xPos - graphData[1].xPos) / 2 - 1
    // this._graphics.moveTo(graphData[0].xPos, Utils.map(graphData[0].weatherModel.precipitation.amount, 1, 0, 0, this._height))
    for (let i = 1; i < graphData.length - 1; i++) {
      const data = graphData[i]
      const preciType = this._getPreciType(data.weatherModel)
      //Logger.trace('MeteoPreci.update('+preciType+')', {'data.weatherModel':data.weatherModel})
      if (preciType >= 0) {
        const amountV = Utils.map(data.weatherModel.precipitation.amount, 1, 0.4, 0, this._height)
        this._graphics.lineStyle(1, MeteoContainer.colors.precipitation[preciType].fillColor)
        this._graphics.beginFill(MeteoContainer.colors.precipitation[preciType].outlineColor, 0.4)
        this._graphics.drawRect(data.xPos - barWidth, amountV, barWidth * 2, this._height - amountV)
        this._icons.push(this.addChild(this._getPreciIcon(data.xPos - 10, this._height - 20, preciType)))
      }
      this._icons.push(this.addChild(this._getSunIcon(data.xPos - 10, 0, Utils.map(data.weatherModel.sun.amount, 0.0, 0.5, 0.0, 1.0))))
    }
  }

  /**
   * Determins the amount and displayable type for the precipitation.
   * slight: 0.4, average: 0.7, heavy: 0.95
   * @param {} weatherModel
   * @returns number
   */
  _getPreciType(weatherModel) {
    if (
      weatherModel.clouds.type <= CLOUD_TYPE.cumulus && // no TCU
      [PRECI_TYPE.drizzle, PRECI_TYPE.rain, PRECI_TYPE.downpour].includes(weatherModel.precipitation.type) && // RAIN, DOWNPOUR, HAIL
      weatherModel.precipitation.amount > 0.3
    ) {
      return 0 // rain
    } else if (
      weatherModel.clouds.type > CLOUD_TYPE.cumulus && // TCU
      [PRECI_TYPE.rain, PRECI_TYPE.downpour, PRECI_TYPE.hail].includes(weatherModel.precipitation.type) && // RAIN, DOWNPOUR, HAIL
      weatherModel.precipitation.amount > 0.3
    ) {
      return 1 // thunderstorm
    } else if ([PRECI_TYPE.snow, PRECI_TYPE.blizzard].includes(weatherModel.precipitation.type) && weatherModel.precipitation.amount > 0.4) {
      return 2 // snow
    } else if (weatherModel.clouds.type == CLOUD_TYPE.fog) {
      return 3 // fog
    } else {
      return -1 // none
    }
  }

  /**
   * Returns a sun icon with the alpha value set to the amount of direct sunshine.
   * @param {*} x
   * @param {*} y
   * @param {*} amount
   * @returns PIXI.Sprite
   */
  _getSunIcon(x, y, amount) {
    // create the icon
    const icon = PIXI.Sprite.from('modules/' + MODULE.ID + '/assets/sun.svg')
    icon.width = icon.height = 20
    icon.position.set(x, y)
    icon.visible = true
    icon.tint = MeteoContainer.colors.sunTint
    icon.alpha = amount
    return icon
  }

  /**
   * Returns a representative icon for the type of precipitation.
   * @param {*} x
   * @param {*} y
   * @param {*} preciType
   * @returns PIXI.Sprite
   */
  _getPreciIcon(x, y, preciType) {
    // create the icon
    const icon = PIXI.Sprite.from('modules/' + MODULE.ID + '/assets/' + MeteoContainer.colors.precipitation[preciType].iconName + '.svg')
    icon.width = icon.height = 20
    icon.position.set(x, y)
    icon.visible = true
    icon.tint = MeteoContainer.colors.precipitation[preciType].iconColor
    return icon
  }
}

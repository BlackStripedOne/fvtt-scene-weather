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
import { METEO } from '../../constants.js'
import { Logger, Utils } from '../../utils.js'

/**
 * Represents a canvas for displaying textual data in form of a legend and labels for the meteogram
 * @extends MeteoContainer
 */
export class MeteoLegend extends MeteoContainer {
  /**
   * horizontal split between the graphical part and the precipitation chart
   */
  static _hSplit = 220

  static _labelStyle = {
    fill: MeteoContainer.colors.labelColor,
    fontFamily: 'Signika',
    fontSize: 10,
    letterSpacing: 0,
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: 'lighter',
    lineJoin: 'round',
    miterLimit: 1,
    strokeThickness: 0.8
  }

  static _tempStyle = {
    fill: MeteoContainer.colors.tempLabelColor,
    fontFamily: 'Signika',
    fontSize: 12,
    letterSpacing: 0,
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
    backgroundColor: MeteoContainer.colors.tempLabelBgColor,
    borderColor: MeteoContainer.colors.tempLabelColor,
    align: 'center',
    verticalAlign: 'center'
  }

  /**
   * Bucket for all labels to be drawn and added to the container.
   * @type {Array[PIXI.Text]}
   */
  _tempLabels = []

  /**
   * Reference to the wind label.
   * @type {PIXI.Text|undefined}
   */
  _windLabel

  /**
   * Reference to the sunshine label.
   * @type {PIXI.Text|undefined}
   */
  _sunshineLabel

  /** @override */
  update(graphData, __hourFrom, __hourTo) {
    this._graphics.clear()
    // fill background
    this._graphics.beginFill(MeteoContainer.colors.legendBgColor)
    this._graphics.drawRect(0, 0, this._width, this._height)
    this._graphics.endFill()

    this._graphics.lineStyle(1, MeteoContainer.colors.tempLabelColor)
    this._graphics.moveTo(0, MeteoLegend._hSplit)
    this._graphics.lineTo(this._width, MeteoLegend._hSplit)
    this._graphics.moveTo(this._width, 0)
    this._graphics.lineTo(this._width, this._height)

    this._printTempScale()
    this._printWindLabel()
    this._printPreciLabel()
    this._printSunshineLabel()

    let minTemp = graphData[0].weatherModel.temp.air
    let maxTemp = minTemp
    for (const data of graphData) {
      minTemp = Math.min(minTemp, data.weatherModel.temp.air)
      maxTemp = Math.max(maxTemp, data.weatherModel.temp.air)
    }
    this._minLabel = this._setLabel(this._minLabel, minTemp)
    this._maxLabel = this._setLabel(this._maxLabel, maxTemp)
    // Check distance
    const distance = Math.abs(this._maxLabel.y - this._minLabel.y)
    if (distance < this._minLabel.height) {
      const shove = (this._minLabel.height - distance) / 2
      Logger.trace('SHOVE', { distance: distance, shove: shove })
      this._minLabel.y += shove
      this._maxLabel.y -= shove
    }
  }

  /**
   * Sets the label for the temperature value in the MeteoLegend component.
   * @param {PIXI.Container} labelContainer - The container for the label. If provided, it will be removed before adding the new label.
   * @param {number} value - The temperature value to be displayed in the label.
   * @returns {PIXI.Container} - The newly created label container.
   */
  _setLabel(labelContainer, value) {
    if (labelContainer) this.removeChild(labelContainer)
    labelContainer = this._getLabel(String(value.toFixed(1)) + ' °C', MeteoLegend._tempStyle)
    labelContainer.x = this._width / 2
    labelContainer.y = Utils.clamp(
      Utils.map(value, METEO.Tmax, METEO.Tmin, 0, MeteoLegend._hSplit),
      0 + labelContainer.height,
      this._height - labelContainer.height
    )
    this.addChild(labelContainer)
    return labelContainer
  }

  /**
   * Removes existing temperature labels and adds new temperature labels to the container.
   * The temperature labels are created based on the temperature range and increment defined by the METEO object.
   * The labels are right-aligned and positioned vertically using PIXI.Text and PIXI.Container.
   */
  _printTempScale() {
    for (const tempLabel of this._tempLabels) {
      this.removeChild(tempLabel)
    }
    this._tempLabels = []
    const yInc = (MeteoLegend._hSplit - 20 - MeteoLegend._labelStyle.fontSize) / ((METEO.Tmax - METEO.Tmin) / 10)
    let y = 0
    for (let degree = METEO.Tmax; degree >= METEO.Tmin; degree -= 10) {
      let text = this.addChild(new PIXI.Text(String(degree + ' °C'), MeteoLegend._labelStyle))
      text.position.set(this._width - 2, y)
      text.anchor.x = 1 // right align text
      this._tempLabels.push(text)
      y += yInc
    }
  }

  /**
   * This function removes the existing wind label, creates a new PIXI.Text element with the label text 'Wind',
   * and positions it within the MeteoLegend container. The wind label is right-aligned.
   */
  _printWindLabel() {
    if (this._windLabel) this.removeChild(this._windLabel)
    let text = this.addChild(new PIXI.Text('Wind', MeteoLegend._labelStyle))
    text.position.set(this._width - 2, MeteoLegend._hSplit - (10 + MeteoLegend._labelStyle.fontSize / 2))
    text.anchor.x = 1 // right align text
    this._windLabel = text
  }

  /**
   * Adds or updates the precipitation label for the MeteoLegend component.
   * The label displays the text "Niederschlag" and is positioned at the bottom right corner of the component.
   */
  _printPreciLabel() {
    if (this._preciLabel) this.removeChild(this._preciLabel)
    let text = this.addChild(new PIXI.Text('Niederschlag', MeteoLegend._labelStyle))
    text.position.set(this._width - 2, this._height - (10 + MeteoLegend._labelStyle.fontSize / 2))
    text.anchor.x = 1 // right align text
    this._preciLabel = text
  }

  /**
   * Prints the "Sunshine" label on the MeteoLegend component.
   * If the sunshine label already exists, it is removed before creating a new one.
   * The label is right-aligned at the specified position within the component.
   */
  _printSunshineLabel() {
    if (this._sunshineLabel) this.removeChild(this._sunshineLabel)
    let text = this.addChild(new PIXI.Text('Sonne', MeteoLegend._labelStyle))
    text.position.set(this._width - 2, MeteoLegend._hSplit + (10 - MeteoLegend._labelStyle.fontSize / 2))
    text.anchor.x = 1 // right align text
    this._sunshineLabel = text
  }
}

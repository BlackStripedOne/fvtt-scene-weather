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
import { METEO } from '../../constants.js'
import { MeteoContainer } from './meteoContainer.js'
import { DashLine } from '../../layer/pixiDashedLine.js'
import { FoundryAbstractionLayer as Fal } from '../../fal.js'

/**
 * Represents a canvas for drawing the temperatures and temperature labels on the canvas.
 * @extends MeteoContainer
 */
export class MeteoTemp extends MeteoContainer {
  static _airTempStyle = {
    fill: MeteoContainer.colors.airColor,
    fontFamily: 'Signika',
    fontSize: 8,
    letterSpacing: 0,
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
    backgroundColor: MeteoContainer.colors.tempLabelBgColor,
    borderColor: MeteoContainer.colors.airColor,
    align: 'left',
    verticalAlign: 'top'
  }

  static _groundTempStyle = {
    fill: MeteoContainer.colors.groundColor,
    fontFamily: 'Signika',
    fontSize: 8,
    letterSpacing: 0,
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
    backgroundColor: MeteoContainer.colors.tempLabelBgColor,
    borderColor: MeteoContainer.colors.groundColor,
    align: 'left',
    verticalAlign: 'top'
  }

  static _percievedTempStyle = {
    fill: MeteoContainer.colors.percievedColor,
    fontFamily: 'Signika',
    fontSize: 8,
    letterSpacing: 0,
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
    backgroundColor: MeteoContainer.colors.tempLabelBgColor,
    borderColor: MeteoContainer.colors.percievedColor,
    align: 'left',
    verticalAlign: 'top'
  }

  /** @override */
  update(graphData) {
    this._graphics.clear()
    const segments = this._width / graphData.length / 5

    let minTemp = graphData[0].weatherModel.temp.air
    let maxTemp = minTemp
    for (const data of graphData) {
      minTemp = Math.min(minTemp, data.weatherModel.temp.air)
      maxTemp = Math.max(maxTemp, data.weatherModel.temp.air)
    }
    // zero line
    const dashZero = new DashLine(this._graphics, {
      dash: [10, 5],
      width: 1,
      color: MeteoContainer.colors.legendBgColor,
      alignment: 0.5,
      alpha: 0.5
    })
    const zeroY = Utils.map(0, METEO.Tmax, METEO.Tmin, 0, this._height)
    dashZero.moveTo(0, zeroY).lineTo(this._width, zeroY)

    // min temp line
    const dashMin = new DashLine(this._graphics, {
      dash: [10, 5],
      width: 1,
      color: MeteoContainer.colors.airColor,
      alignment: 0.5,
      alpha: 0.5
    })
    const minY = Utils.map(minTemp, METEO.Tmax, METEO.Tmin, 0, this._height)
    dashMin.moveTo(0, minY).lineTo(this._width, minY)

    // max temp line
    const dashMax = new DashLine(this._graphics, {
      dash: [10, 5],
      width: 1,
      color: MeteoContainer.colors.airColor,
      alignment: 0.5,
      alpha: 0.5
    })
    const maxY = Utils.map(maxTemp, METEO.Tmax, METEO.Tmin, 0, this._height)
    dashMax.moveTo(0, maxY).lineTo(this._width, maxY)

    // air temperature
    let points = []
    for (const data of graphData) {
      points.push(data.xPos, Utils.map(data.weatherModel.temp.air, METEO.Tmax, METEO.Tmin, 0, this._height))
    }
    this._graphics.lineStyle(4, MeteoContainer.colors.tempLabelBgColor)
    this._graphics.moveTo(points[0], points[1])
    this._drawLines(this._graphics, Utils.getSplinePoints(points, 0.7, false, segments))
    this._graphics.lineStyle(2, MeteoContainer.colors.airColor)
    this._graphics.moveTo(points[0], points[1])
    this._drawLines(this._graphics, Utils.getSplinePoints(points, 0.7, false, segments))

    // percieved temperature
    points = []
    for (const data of graphData) {
      points.push(data.xPos, Utils.map(data.weatherModel.temp.percieved, METEO.Tmax, METEO.Tmin, 0, this._height))
    }
    this._graphics.lineStyle(1, MeteoContainer.colors.percievedColor)
    this._graphics.moveTo(points[0], points[1])
    this._drawLines(this._graphics, Utils.getSplinePoints(points, 0.7, false, segments))

    // ground temperature
    points = []
    for (const data of graphData) {
      points.push(data.xPos, Utils.map(data.weatherModel.temp.ground, METEO.Tmax, METEO.Tmin, 0, this._height))
    }
    this._graphics.lineStyle(1, MeteoContainer.colors.groundColor)
    this._graphics.moveTo(points[0], points[1])
    this._drawLines(this._graphics, Utils.getSplinePoints(points, 0.7, false, segments))

    this._airTempLabel = this._setLabel(this._airTempLabel, Fal.i18n('dialogs.meteoUi.tempCanvas.air'), MeteoTemp._airTempStyle, 2)
    this._groundTempLabel = this._setLabel(
      this._groundTempLabel,
      Fal.i18n('dialogs.meteoUi.tempCanvas.ground'),
      MeteoTemp._groundTempStyle,
      this._airTempLabel.width + 4
    )
    this._percievedTempLabel = this._setLabel(
      this._percievedTempLabel,
      Fal.i18n('dialogs.meteoUi.tempCanvas.percieved'),
      MeteoTemp._percievedTempStyle,
      this._airTempLabel.width + this._groundTempLabel.width + 6
    )
  }

  /**
   * Gets the label for a container.
   * @param {Container} labelContainer - The container element to set the label on.
   * @param {string} value - The value of the label.
   * @param {Object} style - The style to apply to the label.
   * @param {number} offset - The offset value for the label's x-coordinate.
   * @returns {Container} - The updated label container element.
   */
  _setLabel(labelContainer, value, style, offset) {
    if (labelContainer) this.removeChild(labelContainer)
    labelContainer = this._getLabel(value, style)
    labelContainer.x = offset
    labelContainer.y = 2
    this.addChild(labelContainer)
    return labelContainer
  }

  /**
   * Draws a series of connected lines on the provided canvas context.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
   * @param {number[]} pts - An array of x and y coordinates defining the points of the lines.
   *                         The array should have an even number of elements, with each pair of
                             elements representing an (x, y) coordinate.
   * @returns {void}
   */
  _drawLines(ctx, pts) {
    ctx.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length - 1; i += 2) ctx.lineTo(pts[i], pts[i + 1])
  }
}

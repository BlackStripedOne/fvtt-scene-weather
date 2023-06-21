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

import { Logger, Utils } from '../../utils.js'
import { TimeProvider } from '../../time/timeProvider.js'
import { MeteoContainer } from './meteoContainer.js'

/**
 * Represents a canvas for drawing the pointer lines from the knobs to the ranges of the canvas.
 * @extends MeteoContainer
 */
export class SliderMapper extends PIXI.Container {
  // position relative for the left knob
  _leftKnob = 17
  // position relative for the middle knob
  _midKnob = 207
  // position relative for the right knob
  _rightKnob = 585

  // starting range for the left most position of the left knob
  _startRange = -72

  // starting range for the right most position of the right knob
  _endRange = 144

  // this containers' left position. Will be set by constructor
  _leftPos = 0

  // this containers' right position. Will be set by constructor
  _rightPos = 600

  // percentage for the vertical split point. Will be used for calculating the hight in pixel
  _splitPrc = 0.8

  //_graphics
  //_width
  //_height

  /**
   * Special constructor for setting the range values for the slider knobs.
   * @param {*} x
   * @param {*} y
   * @param {*} width
   * @param {*} height
   * @param {*} leftPoint
   * @param {*} rightPoint
   */
  constructor(x, y, width, height, leftPoint = 0, rightPoint = 600) {
    super()
    this.position.set(x, y)
    this.visible = true
    this._width = width
    this._height = height
    this._leftPos = leftPoint
    this._rightPos = rightPoint
    this._graphics = this.addChild(new PIXI.Graphics())
  }

  /** @override */
  update(start, end) {
    Logger.trace('SliderMapper.update(...)', { start: start, end: end, this: this })
    const startKnob = Utils.map(start, this._startRange, 0, this._leftKnob, this._midKnob)
    const midKnob = this._midKnob
    const endKnob = Utils.map(end, 0, this._endRange, this._midKnob, this._rightKnob)
    const splitPoint = this._height * this._splitPrc
    const midPos = Utils.map(TimeProvider.getHourFraction(), start, end, this._leftPos, this._rightPos)

    this._graphics.clear()
    this._graphics.lineStyle(2, MeteoContainer.colors.bounds)
    this._graphics.moveTo(startKnob, this._height)
    this._graphics.lineTo(startKnob, splitPoint)
    this._graphics.lineTo(this._leftPos, 0)

    this._graphics.moveTo(midKnob, this._height)
    this._graphics.lineTo(midKnob, splitPoint)
    this._graphics.lineTo(midPos, 0)

    this._graphics.moveTo(endKnob, this._height)
    this._graphics.lineTo(endKnob, splitPoint)
    this._graphics.lineTo(this._rightPos, 0)
  }
}

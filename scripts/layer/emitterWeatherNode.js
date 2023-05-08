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

import { AbstractWeatherNode } from './abstractWeatherNode.js'

export class EmitterWeatherNode extends AbstractWeatherNode {
  constructor(nodeData) {
    super(nodeData)
  }

  /*--------------------- Static --------------------- */

  /**
   *
   */
  static createEmitterNodeAt(origin) {
    throw new Error('Creating an Emitter Weather Node is not implemented yet.')
  }

  /*--------------------- Private functions --------------------- */

  /** @inheritdoc */
  filterWeatherModel(incomingFilterModel, outsideWeatherModel) {
    if (this.data.type == NODE_TYPE.EMITTER) {
      return this._filterWeatherModelEmitter(incomingFilterModel, outsideWeatherModel)
    } else {
      return incomingFilterModel
    }
  }

  /** @inheritdoc */
  showConfigApp(event) {
    // TODO
  }

  /** @inheritdoc */
  activateListeners() {
    // TODO
  }

  /** @inheritdoc */
  coversPoint(x, y) {
    return false
  }

  /**
   * Destroys the context and graphic of this weatherNode and implementation specific context.
   */
  destroy() {
    // TODO
    super.destroy()
  }

  /**
   * Synchronize the appearance of this WeatherNode with the properties of
   * its represented WeatherNodeData.
   */
  refresh() {
    // TODO
    super.refresh()
  }

  /*--------------------- Functions, Event Handling --------------------- */

  /** @inheritdoc */
  creationDragLeftMove(creationState, event) {
    // TODO
    return creationState // CREATION_STATES.POTENTIAL
  }

  /** @inheritdoc */
  async _onShift(event) {
    // TODO
  }

  /** @inheritdoc */
  async _onShiftRelease(event) {
    // TODO
  }

  /*--------------------- Functions, private, type specific --------------------- */

  /**
   * TODO
   */
  _filterWeatherModelEmitter(incomingFilterModel, outsideWeatherModel) {
    // TODO
  }
}

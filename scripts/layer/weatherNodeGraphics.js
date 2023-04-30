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

/*import { MaskWeatherNode } from './maskWeatherNode.js'
import { EmitterWeatherNode } from './emitterWeatherNode.js'
*/
import { NODE_TYPE } from '../constants.js'

/**
 * A special subclass of PIXI.Graphics used to represent a WeatherNode in the WeatherNodeLayer as well as the SceneWeatherEffects layer mask.
 */
export class WeatherNodeGraphics extends PIXI.Container {
  /**
   * Reference to the WeatherNode to be visually drwn by this graphic.
   * @type {weatherNode}
   */
  _weatherNode

  /**
   * Child on this container containing the Graphics of this drawn WeatherNode
   * @type {PIXI.Graphics}
   */
  _area

  /**
   * Creates a drawing of the weather graphic based on the referenced WeatherNode
   * @param {weatherNode} - weatherNode
   */
  constructor(weatherNode) {
    super()
    this._weatherNode = weatherNode
    this._area = this.addChild(new PIXI.Graphics())
  }

  /**
   * Actually draw the appearance of the underlaying WeatherNodeData based on its settings.
   * Call only once
   */
  draw() {}

  /**
   * This function checks the type of the WeatherNode and calls the corresponding refresh method.
   * If the WeatherNode is an instance of MaskWeatherNode, it calls the _refreshMask() method.
   * If the WeatherNode is an instance of EmitterWeatherNode, it calls the _refreshEmitter() method.
   */
  refresh() {
    if (this._weatherNode.data.type === NODE_TYPE.MASK) {
      this._refreshMask()
    } else if (this._weatherNode.data.type === NODE_TYPE.EMITTER) {
      this._refreshEmitter()
    }
  }

  /**
   * Refreshes the mask of the weather node with updated properties for weather masks.
   */
  _refreshMask() {
    this._area.clear()
    this._area.lineStyle(1, this._weatherNode.data.maskColor)
    this._area.beginFill(this._weatherNode.data.maskColor, 0.5)
    this._area.moveTo(
      this._weatherNode.data.borderNodes[0].x,
      this._weatherNode.data.borderNodes[0].y
    )
    for (let i = 0; i < this._weatherNode.data.borderNodes.length; i++) {
      const p2 =
        this._weatherNode.data.borderNodes[(i + 1) % this._weatherNode.data.borderNodes.length]
      this._area.lineTo(p2.x, p2.y)
    }
    this._area.endFill()
  }

  /**
   * Refreshes the emitter of the weather node with updated properties for weather emitters.
   */
  _refreshEmitter() {
    // TODO
  }
}

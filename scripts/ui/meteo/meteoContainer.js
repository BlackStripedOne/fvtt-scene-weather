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

/**
 * Represents a MeteoContainer, which is a custom PIXI Container used for displaying weather-related graphics.
 * @extends PIXI.Container
 */
export class MeteoContainer extends PIXI.Container {
    static colors = {
      bounds: 0xc85019, // bounds
      hourLine: 0x222222, // hour line
      dayLine: 0x999999, // day line
      labelColor: 0x909090,
      tempLabelColor: 0xf85019,
      tempLabelBgColor: 0x000000,
      legendBgColor: 0x444444,
      preciBgColor: 0x666666,
      sunTint: 0xffcc00,
      airColor: 0xc85019,
      percievedColor: 0xfc9803,
      groundColor: 0x995c00,
      precipitation: [
        {
          // rain, blue
          fillColor: 0x01ccff,
          outlineColor: 0x01ccff,
          iconColor: 0x8bf8ff,
          iconName: 'rain'
        },
        {
          // thunder, purple
          fillColor: 0xcd01ff,
          outlineColor: 0xcd01ff,
          iconColor: 0xe28bff,
          iconName: 'thunder'
        },
        {
          // snow, green
          fillColor: 0x84ff00,
          outlineColor: 0x84ff00,
          iconColor: 0xcdff8b,
          iconName: 'snow'
        },
        {
          // fog, yellow
          fillColor: 0xffde01,
          outlineColor: 0xffde01,
          iconColor: 0xfff68b,
          iconName: 'fog'
        }
      ]
    }
  
    /**
     * @private
     * @type {PIXI.Graphics}
     */
    _graphics
  
    /**
     * @private
     * @type {number}
     */
    _width
  
    /**
     * @private
     * @type {number}
     */
    _height
  
    /**
     * Creates an instance of MeteoContainer.
     * @param {number} [x=0] - The x-coordinate of the container's position.
     * @param {number} [y=0] - The y-coordinate of the container's position.
     * @param {number} [width=100] - The width of the container.
     * @param {number} [height=100] - The height of the container.
     * @param {boolean} [clipOverflow=true] - Indicates whether to clip the overflow of the container.
     */
    constructor(x = 0, y = 0, width = 100, height = 100, clipOverflow = true) {
      super()
      this.position.set(x, y)
      this.visible = true
      this._width = width
      this._height = height
      if (clipOverflow) {
        const outterClip = new PIXI.Graphics()
        outterClip.drawRect(0, 0, width, height)
        outterClip.renderable = true
        outterClip.cacheAsBitmap = true
        this.addChild(outterClip)
        this.mask = outterClip
      }
      this._graphics = this.addChild(new PIXI.Graphics())
      this._init()
    }
  
    /**
     * The init function is called to initialize the container plugin for the meteo UI.
     * Potentially setting up filters or other sub containers. This function is called
     * once.
     */
    _init() {}
  
    /**
     * Updates the graph data within the container.
     * @param {any} __graphData - The graph data to be updated.
     * @param {number} __hourFrom - The starting hour.
     * @param {number} __hourTo - The ending hour.
     */
    update(__graphData, __hourFrom, __hourTo) {}
  
    /**
     * Generates a labeled container with a message and specified style.
     * @param {string} message - The text message to be displayed.
     * @param {object} style - The style configuration for the label.
     * @param {number} style.backgroundColor - The background color of the label.
     * @param {number} style.borderColor - The border color of the label.
     * @param {string} style.align - The horizontal alignment of the label ('left', 'center', 'right').
     * @param {string} style.verticalAlign - The vertical alignment of the label ('top', 'middle', 'bottom').
     * @returns {PIXI.Container} - The labeled container.
     */
    _getLabel(message, style) {
      let container = new PIXI.Container()
      let text = new PIXI.Text(message, style)
      text.x = 2
      text.y = 2
      let bubble = new PIXI.Graphics()
      bubble.beginFill(style.backgroundColor)
      bubble.lineStyle(1, style.borderColor)
      bubble.drawRoundedRect(0, 0, text.width + 3, text.height + 3, 4)
      bubble.endFill()
      container.addChild(bubble)
      container.addChild(text)
      switch (style.align) {
        case 'center':
          container.pivot.x = container.width / 2
          break
        case 'right':
          container.pivot.x = container.width
          break
        case 'left':
        default:
          container.pivot.x = 0
          break
      }
      switch (style.verticalAlign) {
        case 'middle':
          container.pivot.y = container.height / 2
          break
        case 'bottom':
          container.pivot.y = container.height
          break
        case 'top':
        default:
          container.pivot.y = 0
          break
      }
      return container
    }
  }
  
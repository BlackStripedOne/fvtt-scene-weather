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

import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

// inject a new template to the static built hud container of foundry.
Hooks.on('renderHeadsUpDisplay', (app, jQ, options) => {
  Logger.trace('->Hook:renderHeadsUpDisplay', {
    app: app,
    jQ: jQ,
    options: options,
    hud: canvas.hud.weatherNode
  })
  const hud = canvas.hud.weatherNode?.options || {
    id: 'weathernode-hud'
  }
  if (jQ.find('#' + hud.id).length == 0) {
    jQ.append('<template id="' + hud.id + '"></template>')
  }
})

/**
 * The WeatherNodeHud is a UI element for controlling the state of a WeatherNode.
 */
export class WeatherNodeHud extends Application {
  /**
   * Reference a WeatherNode this HUD is currently bound to
   * @type {WeatherNode|undefined}
   */
  weatherNode = undefined

  /* --------------------- static ----------------------- */

  /** @inheritdoc */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      id: 'weathernode-hud',
      template: 'modules/' + MODULE.ID + '/templates/weatherNodeHud.hbs',
      classes: ['placeable-hud'],
      popOut: false
    })
  }

  /* --------------------- Functions, public ----------------------- */

  /**
   * Bind the HUD to a new PlaceableObject and display it
   * @param {PlaceableObject} object    A PlaceableObject instance to which the HUD should be bound
   */
  bind(weatherNode) {
    Logger.trace('WeatherNodeHud.bind(...)', { weatherNode: weatherNode })
    const states = this.constructor.RENDER_STATES
    if ([states.CLOSING, states.RENDERING].includes(this._state)) return
    if (this.weatherNode) this.clear()
    this.weatherNode = weatherNode
    // Render the HUD
    this.render(true)
    this.element.hide().fadeIn(200)
  }

  /** @override */
  getData(options = {}) {
    const data = this.weatherNode.data.toObject()
    return Utils.mergeObject(data, {
      id: this.id,
      classes: this.options.classes.join(' '),
      appId: this.appId,
      lockedClass: data.locked ? 'active' : '',
      lockedIcon: this._getLockedIcon(data),
      enabledClass: data.enabled ? 'active' : '',
      enabledIcon: this._getEnabledIcon(data)
    })
  }

  /**
   * Clear the HUD by fading out it's active HTML and recording the new display state
   */
  clear() {
    const states = this.constructor.RENDER_STATES
    if (this._state <= states.NONE) return
    this._state = states.CLOSING

    // Unbind
    this.weatherNode = null
    this.element.hide()
    this._element = null
    this._state = states.NONE
  }

  /** @override */
  setPosition(options) {
    Logger.trace('WeatherNodeHud.setPosition(...)', { options: options })
    const { x, y, width, height } = this.weatherNode.data
    const c = 80 // center
    const p = 5 // padding
    const position = {
      width: width + c * 2 + p * 2,
      height: height + p * 2,
      left: x - c - p,
      top: y - p
    }
    this.element.css(position)
  }

  /** @override */
  activateListeners(html) {
    Logger.trace('WeatherNodeHud.activateListeners(...)', { html: html })
    html.find('.control-icon').click(this._onClickControl.bind(this))
  }

  /* ---------------------- Functions, private ---------------------- */

  /** @override */
  async _render(...args) {
    await super._render(...args)
    this.setPosition()
  }

  /**
   * Returns the appropriate icon for a given data object based on whether it is locked or unlocked.
   * @param {Object} data - The data object to determine the icon for.
   * @param {boolean} [invert=false] - Whether to invert the icon based on the locked state.
   * @returns {string} - The icon string representing the locked or unlocked state of the data object.
   */
  _getLockedIcon(data, invert = false) {
    return (invert ? !data.locked : data.locked) ? 'fa-lock' : 'fa-lock-open'
  }

  /**
   * Returns the appropriate icon for a given data object based on whether it is enabled or disabled.
   * @param {Object} data - The data object to determine the icon for.
   * @param {boolean} [invert=false] - Whether to invert the icon based on the enabled state.
   * @returns {string} - The icon string representing the endabled or disabled state of the data object.
   */
  _getEnabledIcon(data, invert = false) {
    return (invert ? !data.enabled : data.enabled) ? 'fa-eye' : 'fa-eye-slash'
  }

  /**
   * Handle mouse clicks to control a HUD control button
   * @param {PointerEvent} event - The originating click event
   */
  _onClickControl(event) {
    Logger.trace('WeatherNodeHud._onClickControl(...)', { event: event })
    const button = event.currentTarget
    switch (button.dataset.action) {
      case 'enabled':
        return this._onToggleEnabled(event)
      case 'locked':
        return this._onToggleLocked(event)
      case 'sort-up':
        return this._onSort(event, true)
      case 'sort-down':
        return this._onSort(event, false)
    }
  }

  /**
   * Toggle the enabled state of all controlled objects in the Layer
   * @param {PointerEvent} event - The originating click event
   * @returns {Promise}
   */
  async _onToggleEnabled(event) {
    event.preventDefault()
    // Toggle the visible state
    const isEnabled = this.weatherNode.data.enabled
    const updates = canvas.sceneweather.controlled.map((weatherNode) => {
      return { id: weatherNode.id, enabled: !isEnabled }
    })
    // update all objects
    event.currentTarget.classList.toggle('active', !isEnabled)
    $(event.currentTarget)
      .children('i')
      .first()
      .attr('class', 'fas fa-solid ' + this._getEnabledIcon(this.weatherNode.data, true))
    return canvas.sceneweather.updateNodes(updates)
  }

  /**
   * Toggle locked state of all controlled objects in the Layer
   * @param {PointerEvent} event - The originating click event
   * @returns {Promise}
   */
  async _onToggleLocked(event) {
    event.preventDefault()
    // Toggle the visible state
    const isLocked = this.weatherNode.data.locked
    const updates = canvas.sceneweather.controlled.map((weatherNode) => {
      return { id: weatherNode.id, locked: !isLocked }
    })
    // update all objects
    event.currentTarget.classList.toggle('active', !isLocked)
    $(event.currentTarget)
      .children('i')
      .first()
      .attr('class', 'fas fa-solid ' + this._getLockedIcon(this.weatherNode.data, true))
    return canvas.sceneweather.updateNodes(updates)
  }

  /**
   * Handle sorting the z-order of the object
   * @param {boolean} up            Move the object upwards in the vertical stack?
   * @param {PointerEvent} event    The originating mouse click event
   * @returns {Promise}
   */
  async _onSort(event, up) {
    event.preventDefault()
    const siblings = canvas.sceneweather.nodes
    const controlled = canvas.sceneweather.controlled.filter(
      (weatherNode) => !weatherNode.data.locked
    )

    // Determine target sort index
    let z = 0
    if (up) {
      controlled.sort((a, b) => a.data.z - b.data.z)
      z = siblings.length ? Math.max(...siblings.map((weatherNode) => weatherNode.data.z)) + 1 : 1
    } else {
      controlled.sort((a, b) => b.data.z - a.data.z)
      z = siblings.length ? Math.min(...siblings.map((weatherNode) => weatherNode.data.z)) - 1 : -1
    }

    // Update all controlled objects
    const updates = controlled.map((weatherNode, i) => {
      const d = up ? i : i * -1
      return { id: weatherNode.id, z: z + d }
    })
    return canvas.sceneweather.updateNodes(updates)
  }
}

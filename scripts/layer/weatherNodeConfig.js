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
import { MODULE, NODE_TYPE, AMBIENCE_TYPE } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { Permissions } from '../permissions.js'

export class WeatherNodeConfig extends FormApplication {

  /**
   * @param {WeatherNode} weatherNode - The underlaying inherited object of AbstractWeatherNode holding the data to be editable
   * @param {DocumentSheetOptions} [options={}]  Optional configuration parameters for how the form behaves.
   */
  constructor(weatherNode, options = {}) {
    super(weatherNode, options)
    this.weatherNode = weatherNode
  }

  /* ---------------------- properties ---------------------- */

  /** @inheritdoc */
  get title() {
    const typeIds = [
      'dialogs.weatherNodeConfig.titleMask', // MASK
      'dialogs.weatherNodeConfig.titleEmitter' // EMITTER
    ]
    return Fal.i18n(typeIds[this.weatherNode.data.type] || typeIds[0])
  }

  /** @inheritdoc */
  get id() {
    return this.weatherNode.id
  }

  /** @inheritdoc */
  get isEditable() {
    return (this.options.editable && !this.weatherNode.data.locked)
  }

  /* --------------------- static ----------------------- */

  /**
   * @override
   * @returns {DocumentSheetOptions}
   */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      classes: ["sheet"],
      template: 'modules/' + MODULE.ID + '/templates/weatherNodeConfig.hbs',
      viewPermission: Permissions.hasPermission(Fal.userID(), 'sceneSettings'),
      id: "weather-node-config",
      width: 480,
      height: "auto",
      tabs: [{ navSelector: ".tabs", contentSelector: "form", initial: "form" }]
    })
  }

  /* -------------------- Functions, public ------------------------ */

  /** @override */
  async close(options) {
    await super.close(options)
    delete canvas.sceneweather.apps?.[this.id]
  }

  /** @override */
  getData(options = {}) {
    const [typeName] = Object.entries(NODE_TYPE).find(([, val]) => val === this.weatherNode.data.type)
    let data = {
      'x': this.weatherNode.data.x,
      'y': this.weatherNode.data.y,
      'z': this.weatherNode.data.z,
      'enabled': this.weatherNode.data.enabled,
      'type': typeName.toLowerCase() || 'unknown'
    }

    // add type specific elements to data
    switch (this.weatherNode.data.type) {
      case NODE_TYPE.MASK:
        const [maskName] = Object.entries(AMBIENCE_TYPE).find(([, val]) => val === this.weatherNode.data.mask)
        data.mask = maskName || 'outside'
        const masks = Object.keys(AMBIENCE_TYPE).map(maskType => {
          return {
            'id': maskType,
            'name': 'dialogs.weatherNodeConfig.maskType.' + maskType
          }
        })
        data.masks = masks
        data.feather = this.weatherNode.data.feather
        break
    }

    // Rendering context
    return {
      'id': this.id,
      'appId': this.appId,
      'data': data
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
  }

  /** @inheritdoc */
  render(force = false, options = {}) {
    // Register the active Application with the sceneweather layer
    canvas.sceneweather.apps[this.id] = this   // key was this.appId
    return super.render(force, options)
  }

  /* -------------------- Functions, private ------------------------ */

  /** @inheritDoc */
  async _renderOuter() {
    const html = await super._renderOuter()
    // inject weatherNode ID link and symbols
    this._injectWeatherNodeHeader(html)
    return html
  }

  /**
   * 
   * @param {jQuery} html
   * @protected
   */
  _injectWeatherNodeHeader(html) {
    const title = html.find(".window-title")
    const enabled = this.weatherNode.data.enabled ? '<i class="fa-solid fa-eye"></i> ' : '<i class="fa-solid fa-eye-slash"></i> '
    const locked = this.weatherNode.data.locked ? '<i class="fa-solid fa-lock"></i> ' : '<i class="fa-solid fa-lock-open"></i> '
    title.prepend(enabled)
    title.prepend(locked)
    const label = 'WeatherNode'
    const idLink = document.createElement("a")
    idLink.classList.add("document-id-link")
    idLink.setAttribute("alt", "Copy document id")
    idLink.dataset.tooltip = `${label}: ${this.weatherNode.data.id}`
    idLink.dataset.tooltipDirection = "UP"
    idLink.innerHTML = '<i class="fa-solid fa-passport"></i>'
    idLink.addEventListener("click", event => {
      event.preventDefault()
      Utils.copyToClipboard(this.weatherNode.data.id)
      Logger.info(game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type: "id", id: this.weatherNode.data.id }), true)  // TODO use Fal
    })
    idLink.addEventListener("contextmenu", event => {
      event.preventDefault()
      Utils.copyToClipboard(this.weatherNode.data.id)
      Logger.info(game.i18n.format("DOCUMENT.IdCopiedClipboard", { label, type: "uuid", id: this.weatherNode.data.id }), true)  // TODO use Fal
    })
    title.append(idLink)
  }

  /** @override */
  async _updateObject(event, formData) {
    const sceneRect = canvas.dimensions.sceneRect
    const minSize = canvas.dimensions.size * 0.5
    const maskNumber = AMBIENCE_TYPE[formData.mask]

    let changes = {}

    const newX = Utils.clamp(formData.x, sceneRect.x, (sceneRect.x + sceneRect.width) - minSize)
    const newY = Utils.clamp(formData.y, sceneRect.y, (sceneRect.y + sceneRect.height) - minSize)
    if (formData.x != this.weatherNode.data.x) changes.x = newX
    if (formData.y != this.weatherNode.data.y) changes.y = newY

    if (formData.z != this.weatherNode.data.z) changes.z = formData.z
    if (formData.enabled != this.weatherNode.data.enabled) changes.enabled = formData.enabled
    if (maskNumber || (maskNumber != this.weatherNode.data.mask)) changes.mask = maskNumber

    if (formData.feather != this.weatherNode.data.feather) changes.feather = Utils.clamp(formData.feather, 0, 100)

    Logger.trace('WeatherNodeConfig._updateObject(...)', { 'event': event, 'formData': formData, 'changes': changes, 'maskNumber': maskNumber })

    if (Object.keys(changes).length > 0) {
      changes.id = this.weatherNode.id
      canvas.sceneweather.updateNodes([changes])
    }
  }


}

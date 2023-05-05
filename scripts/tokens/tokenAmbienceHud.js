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

import { Utils } from '../utils.js'
import { MODULE } from '../constants.js'
import { Permissions } from '../permissions.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

/**
 * This function injects a new template to the static built HUD container
 * of Foundry Virtual Tabletop (VTT) as it is not build to be extensible yet.
 * @param {object} app - The Foundry application object.
 * @param {object} jQ - The jQuery object used to manipulate the HUD container.
 * @param {object} options - Additional options that can be passed in for customization.
 */
Hooks.on('renderHeadsUpDisplay', (app, jQ, options) => {
  const hud = canvas.hud.tokenAmbience?.options || {
    id: 'tokenambience-hud'
  }
  if (jQ.find('#' + hud.id).length == 0) {
    jQ.append('<template id="' + hud.id + '"></template>')
  }
})

/**
 * Hooks on 'hoverToken' event to show/hide the token ambience HUD when hovering over a token.
 * @param {Token} token - The token being hovered over.
 * @param {boolean} hovered - Whether the token is being hovered over or not.
 */
Hooks.on('hoverToken', (token, hovered) => {
  if (token.isPreview) return
  if (hovered) {
    if ('ambience' in token) {
      if (Permissions.hasPermission(Fal.userID(), 'ambienceHud')) {
        if (Fal.getSetting('ambienceTokenHudPosition', 'top') !== 'none') {
          TokenAmbienceHud.getTokenAmbienceHud().bind(token)
        }
      }
    }
  } else {
    const hud = TokenAmbienceHud.getTokenAmbienceHud()
    if (hud.token === token) {
      hud.clear()
    }
  }
})

/**
 * This function registers a listener to the 'destroyToken' event using the Hooks.on() function
 * provided by the Foundry Virtual Tabletop API.
 * When this event is triggered, the callback function is executed with the destroyed token as
 * a parameter. The function checks if the token is the current token displayed in the TokenAmbienceHud,
 * and if so, clears the ambience effects from the HUD using the clear() function.
 * @param {Token} token - The token that was destroyed
 */
Hooks.on('destroyToken', (token) => {
  const hud = TokenAmbienceHud.getTokenAmbienceHud()
  if (hud.token === token) {
    hud.clear()
  }
})

/**
 * Handle token updates/movement This function is a callback that is triggered when a token is
 * updated or moved in a Foundry VTT game.
 * It clears the TokenAmbienceHud if the token being updated or moved is the same as the one
 * being displayed in the hud.
 * @param {object} doc - The updated token's data.
 * @param {object} delta - The changes made to the token's data.
 * @param {object} options - Options for updating the token.
 * @param {string} id - The ID of the updated token.
 */
Hooks.on('updateToken', async (doc, delta, options, id) => {
  const hud = TokenAmbienceHud.getTokenAmbienceHud()
  if (hud && hud.token && delta._id && hud.token.id === delta._id) {
    hud.clear()
  }
})

/**
 * Exntending the HUD:
 * - Use call 'renderTokenAmbienceHud' (TokenAmbienceHud, html, data) to intercept drawing and add your own elements.
 */
export class TokenAmbienceHud extends Application {

  /**
   * The bound token for which the HUD shall be rendered.
   * @type {Token|undefined}
   */
  token = undefined

  /* --------------------- static ----------------------- */

  /**
   * If nodes on this PlaceableLayer have a HUD UI, provide a reference to its instance
   * @type {BasePlaceableHUD|null}
   */
  static getTokenAmbienceHud() {
    // inject the hud application in foundry as foundry is not build to be extended by other huds (yet)
    if (!canvas.hud.tokenAmbience) {
      canvas.hud.tokenAmbience = new TokenAmbienceHud()
    }
    return canvas.hud.tokenAmbience
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      id: 'tokenambience-hud',
      template: 'modules/' + MODULE.ID + '/templates/tokenAmbienceHud.hbs',
      classes: ['placeable-hud'],
      popOut: false
    })
  }

  /* --------------------- Functions, public ----------------------- */

  /**
   * Bind the HUD to a new PlaceableObject and display it
   * @param {PlaceableObject} object    A PlaceableObject instance to which the HUD should be bound
   */
  bind(token) {
    const states = this.constructor.RENDER_STATES
    if ([states.CLOSING, states.RENDERING].includes(this._state)) return
    if (this.token) this.clear()
    this.token = token
    // Render the HUD
    this.render(true)
    this.element.hide().fadeIn(200)
  }

  /** @override */
  getData(options = {}) {
    const data = this.token.ambience || {}
    return Utils.mergeObject(data, {
      id: this.id,
      classes: this.options.classes.join(' '),
      appId: this.appId
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
    this.token = undefined
    this.element.hide()
    this._element = null
    this._state = states.NONE
  }

  /** @override */
  setPosition(options = {}) {
    const { x, y, h, w } = this.token
    const topBottom = (Fal.getSetting('ambienceTokenHudPosition', 'top') === 'top')
    if (topBottom) {
      this.element.css({
        left: x + (w / 2),
        top: y,
        transform: 'translate(-50%, calc(-100% - 35px))'
      })
    } else {
      this.element.css({
        left: x + (w / 2),
        top: y + h,
        transform: 'translate(-50%, 35px)'
      })
    }
  }

  /* ---------------------- Functions, private ---------------------- */

  /** @override */
  async _render(...args) {
    await super._render(...args)
    this.setPosition()
  }
}

/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.

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

import { Logger, Utils } from './utils.js'
import { MODULE, EVENTS, GENERATOR_MODES } from './constants.js'
import { TimeProvider } from './timeProvider.js'
import { WeatherPerception } from './weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { Permissions } from './permissions.js'

Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  Logger.debug('->Hook:WeatherUpdated -> WeatherUI.update(...)', { 'data': data })
  // TODO only for GMs?
  if (data.sceneId == canvas.scene._id && data.model !== undefined) {
    WeatherUi.update(data.model)
  }
})

Hooks.on(MODULE.LCCNAME + 'WeatherDisabled', async (data) => {
  // TODO maybe handle hiding of the window instead of in the render method?
})

Hooks.on('renderWeatherUi', () => {
  Logger.debug('->Hook:renderWeatherUi')
  WeatherUi.update()
})

Hooks.on('updateWorldTime', () => {
  WeatherUi._updateTimeHeadline()
})



/**
 * Helper clsss for the weather configuration tab on the scene settings dialog.
 */
export class WeatherUi extends FormApplication {
  static _isOpen = false
  static _weatherModel = {}
  static _perceptionId = undefined

  /**
   * TODO called from Foundry VTT API
   */
  async _render(force = false, options = {}) {
    Logger.debug('WeatherUi._render(...)', { 'force': force, 'options': options })
    await super._render(force, options)
    if (Fal.getSetting('uiPinned', false)) {
      WeatherUi.pinApp()
    }

    WeatherUi._isOpen = true
    // Remove the window from candidates for closing via Escape.
    delete ui.windows[this.appId]
    // hide the app when we have weather DISABLED
    if ((Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED) == GENERATOR_MODES.DISABLED) ||
      (!WeatherUi._weatherModel.hasPerceiver)) {
      Logger.debug('WeatherUi._render() -> hiding app, DISABLED')
      $('#scene-weather-app').css("visibility", "hidden")
    } else {
      $('#scene-weather-app').css("visibility", "visible")
    }
  }

  /**
   * Close the application and un-register references to it within UI mappings This function
   * returns a Promise which resolves once the window closing animation concludes
   * Override original #close method inherited from parent class.
   * 
   * @param {*} options 
   * @returns {Promise} - A Promise which resolves once the application is closed
   */
  async close(options = {}) {
    // If called by scene weather, record that it is not longer visible.
    if (options.sceneWeather) {
      WeatherUi._isOpen = false
      await Fal.setSetting('uiVisible', false)
    }
    return super.close(options)
  }

  /**
   * TODO
   */
  constructor() {
    super()
    Logger.debug('WeatherUi.ctor')
  }

  /**
   * Assign the default options which are supported by the document
   * edit sheet. In addition to the default options object supported by the parent Application
   * class, the Form Application supports the following additional keys and values:
   * 
   * @returns {ApplicationOptions} - The default options for this FormApplication class
   */
  static get defaultOptions() {
    this.initialPosition = Fal.getSetting('uiPosition', { 'top': 40, 'left': 40 })
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      width: 200,
      height: 100,
      submitOnChange: true,
      closeOnSubmit: false,
      minimizable: false,
      template: 'modules/' + MODULE.ID + '/templates/weatherUi.hbs',
      id: 'scene-weather-app',
      title: 'dialogs.weatherUi.title',
      top: this.initialPosition.top,
      left: this.initialPosition.left
    })
  }

  /**
   * This method is called upon form submission after form data is validated
   * 
   * @param {Event} event - The initial triggering submission event
   * @param {Object} formData - The object of validated form data with which to update the object
   * @returns {Promise} - A Promise which resolves once the update operation has completed
   */
  async _updateObject(event, formData) {
    // TODO
    Logger.debug('WeatherUi._updateObjec', { 'event': event, 'formData': formData })
  }

  /**
   * TODO
   */
  static _addModelFlags() {
    const userId = Fal.userID()
    WeatherUi._weatherModel.hasControls = Permissions.hasPermission(userId, 'weatherUiControls')
    WeatherUi._weatherModel.hasPerceiver = WeatherPerception.getAllowedIds(Fal.userID()).length >= 1
    WeatherUi._weatherModel.hasPerceivers = WeatherPerception.getAllowedIds(Fal.userID()).length > 1
    WeatherUi._weatherModel.hasTimeAuthority = Permissions.hasPermission(userId, 'timeControls')
      && WeatherUi._weatherModel.hasControls
      && TimeProvider.hasTimeAuthority()
      && [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))

    if (WeatherUi._weatherModel.hasTimeAuthority) {
      WeatherUi._weatherModel.timeHeadline = TimeProvider.getI18nDateString()
    } else {
      WeatherUi._weatherModel.timeHeadline = ''
    }
  }

  /**
   * An application should define the data object used to render its template. This function
   * may either return an Object directly, or a Promise which resolves to an Object If undefined,
   * the default implementation will return an empty object allowing only for rendering of static HTML
   * 
   * @returns {Object} - the data scructure to handle the handlebars rendering
   */
  getData() {
    WeatherUi._addModelFlags()

    Logger.debug('WeatherUi.getData()', { '_weatherModel': WeatherUi._weatherModel })
    return WeatherUi._weatherModel
  }

  /**
   * TODO
   */
  _attachDragHandler(jQ) {
    const dragHandle = jQ.find('#weatherHeadline')[0]
    const drag = new Draggable(this, jQ, dragHandle, false)

    // the attachment zone is the "wiggle area" in which the app will be locked
    // to a pinned position if dropped. pinZone stores whether or not
    // we're currently in that area.
    let insideAttachZone = false

    // this has to be override this because of the non-standard drag
    // handle, and also to manage the attachment lock zone and animation effects.
    drag._onDragMouseMove = function _newOnDragMouseMove(event) {
      event.preventDefault()
      const playerApp = document.getElementById('players')
      const playerAppPos = playerApp.getBoundingClientRect()

      // maximum 60 updates per second to not stress the browser
      const now = Date.now()
      if (now - this._moveTime < 1000 / 60) return
      this._moveTime = now

      // after unpinning, make the drag track from the existing location in screen space
      const { left, top } = this.element.getBoundingClientRect()
      if (WeatherUi.unPinApp()) {
        Object.assign(this.position, { left, top })
      }

      // attach position to the mouse
      this.app.setPosition({
        left: this.position.left + (event.clientX - this._initial.x),
        top: this.position.top + (event.clientY - this._initial.y)
      })

      // set the attachment region above the Player's list that will
      // trigger the wiggle
      let playerAppUpperBound = playerAppPos.top - 50
      let playerAppLowerBound = playerAppPos.top + 50

      if (
        event.clientX > playerAppPos.left &&
        event.clientX < playerAppPos.left + playerAppPos.width &&
        event.clientY > playerAppUpperBound &&
        event.clientY < playerAppLowerBound
      ) {
        $('#scene-weather-app').css('animation', 'jiggle 0.2s infinite')
        insideAttachZone = true
      } else {
        $('#scene-weather-app').css('animation', '')
        insideAttachZone = false
      }
    }

    drag._onDragMouseUp = async function _newOnDragMouseUp(event) {
      event.preventDefault()
      window.removeEventListener(...this.handlers.dragMove)
      window.removeEventListener(...this.handlers.dragUp)

      const playerApp = document.getElementById('players')
      const playerAppPos = playerApp.getBoundingClientRect()
      const myOffset = playerAppPos.height + 90 // TODO Pin Offset

      // if the mouseup is inside the attachment zone, pin the ui.
      if (insideAttachZone) {
        WeatherUi.pinApp()
        // TODO use Fal here
        await Fal.setSetting('uiPinned', true)
        this.app.setPosition({
          left: 15,
          top: window.innerHeight - myOffset
        })
      } else {
        const windowPos = $('#scene-weather-app').position()
        const newPos = { top: windowPos.top, left: windowPos.left }
        // TODO use Fal here
        await Fal.setSetting('uiPosition', newPos)
        await Fal.setSetting('uiPinned', false)
      }

      // remove the wiggle animation on mouseUp.
      $('#scene-weather-app').css('animation', '')
    }
  }

  /**
   * Attach the controls for time control / chat and clipboard to the respective
   * html elements, if the current player is a GM and the time provider is set to
   * internal.
   * 
   * @param {jQuery} jQ - the jQuery instance containing the UI window html.
   */
  _attachControls(jQ) {
    if (!WeatherUi._weatherModel.hasControls) return
    jQ.find('#weatherControls li').each(function (id) {
      const controlJQ = $(this)
      const controlFunc = controlJQ.attr('data-func') || 'none'
      const controlBase = Number(controlJQ.attr('data-base') || '0')
      switch (controlFunc) {
        case 'time':
          if (WeatherUi._weatherModel.hasTimeAuthority) {
            controlJQ.on('click', function () {
              TimeProvider.advanceGameTime((window.event.ctrlKey ? controlBase * 5 : controlBase))
            })
          }
          break
        case 'chatSingle':
          if (WeatherUi._weatherModel.hasControls) {
            controlJQ.on('click', async function () {
              const tokens = Fal.getControlledTokens()
              if (tokens.length == 0) {
                Logger.info(Fal.i18n('dialogs.weatherUi.chatNotice'), true)
              } else {
                const userIds = tokens.map(token => { return Fal.getUserByToken(token) })
                Logger.debug('chatSingle', { 'tokens': tokens, 'userIds': userIds })
                const weatherChatHtml = await WeatherPerception.getAsChatHtml(WeatherUi._perceptionId, WeatherUi._weatherModel)
                ChatMessage.create({
                  user: Fal.userID(),
                  whisper: userIds,
                  content: weatherChatHtml
                })
              }
            })
          }
          break
        case 'chatAll':
          if (WeatherUi._weatherModel.hasControls) {
            controlJQ.on('click', async function () {
              const weatherChatHtml = await WeatherPerception.getAsChatHtml(WeatherUi._perceptionId, WeatherUi._weatherModel)
              ChatMessage.create({
                user: Fal.userID(),
                content: weatherChatHtml
              })
            })
          }
          break
        case 'clipboard':
          if (WeatherUi._weatherModel.hasControls) {
            controlJQ.on('click', async function () {
              const weatherText = await WeatherPerception.getAsText(WeatherUi._perceptionId, WeatherUi._weatherModel)
              Utils.copyToClipboard(weatherText)
              Logger.info(Fal.i18n('dialogs.weatherUi.clipboardNotice'), true)
            })
          }
          break
      }
    })
  }

  /**
   * Attach the control handlers for the previous and next weather perception selections, if the
   * current player has more then 1 potential perciever allowed.
   * 
   * @param {jQuery} jQ - the jQuery instance containing the UI window html.
   */
  _attachPerceiverControls(jQ) {
    if (!WeatherUi._weatherModel.hasPerceivers) return
    jQ.find('#weatherContainer .percControl').each(function (id) {
      const controlJQ = $(this)
      const controlFunc = controlJQ.attr('data-func') || 'none'
      switch (controlFunc) {
        case 'prevPerc':
          controlJQ.on('click', async function () {
            const percieverIds = WeatherPerception.getAllowedIds(Fal.userID())
            WeatherUi._perceptionId = Utils.arrayPrev(percieverIds, WeatherUi._perceptionId)
            Logger.debug('click()', { 'perceiverPrev': WeatherUi._perceptionId })
            await Fal.setUserFlag('perceptionId', WeatherUi._perceptionId)
            WeatherUi.update()
          })
          break
        case 'nextPerc':
          controlJQ.on('click', async function () {
            const percieverIds = WeatherPerception.getAllowedIds(Fal.userID())
            WeatherUi._perceptionId = Utils.arrayNext(percieverIds, WeatherUi._perceptionId)
            Logger.debug('click()', { 'perceiverNext': WeatherUi._perceptionId })
            await Fal.setUserFlag('perceptionId', WeatherUi._perceptionId)
            WeatherUi.update()
          })
          break
      }
    })
  }

  /**
   * Activate all listeners for the UI jQuery object given.
   * 
   * @param {jQuery} jQ - the jQuery instance containing the UI window html.
   */
  activateListeners(jQ) {
    super.activateListeners(jQ)
    // attach drag handler for moving the UI and pinning it to predefined positions
    this._attachDragHandler(jQ)
    this._attachControls(jQ)
    this._attachPerceiverControls(jQ)
  }

  /**
   * Pin the UI above the player's list inside the ui-left container.
   */
  static async pinApp() {
    const app = Fal.getModule().uiApp
    if (app && !app.element.hasClass('pinned')) {
      $('#players').before(app.element)
      app.element.addClass('pinned')
    }
  }

  /**
   * Un-pin the UI window.
   * @returns true, if the UI was unpinned.
   */
  static unPinApp() {
    const app = Fal.getModule().uiApp
    if (app && app.element.hasClass('pinned')) {
      const element = app.element
      $('body').append(element)
      element.removeClass('pinned')
      return true
    }
  }

  /**
   * Toggle visibility of the main window, the mode is set to 'tiggle' otherwise
   * the main window of the UI will be set visible if it is set visible in the
   * settings.
   * 
   * @param {String} mode - the optional mode for setting the app visible 
   */
  static async toggleAppVis(mode) {
    //TODO check wether player is allowed to view weather
    if (mode === 'toggle') {
      if (Fal.getSetting('uiVisible', false) === true) {
        // Stop any currently-running animations, and then animate the app
        // away before close(), to avoid the stock close() animation.
        $('#scene-weather-app').stop()
        $('#scene-weather-app').css({ animation: 'close 0.3s', opacity: '0' })
        setTimeout(function () {
          // Pass an object to .close() to indicate that it came from SceneWeather
          // itself istead of an Esc keypress.
          Fal.getModule().uiApp.close({ sceneWeather: true })
        }, 200)
      } else {
        // Make sure there isn't already an instance of the app rendered.
        // Fire off a close() just in case, clears up some stuck states.
        if (WeatherUi._isOpen) {
          Fal.getModule().uiApp.close({ sceneWeather: true })
        }
        Fal.getModule().uiApp = await new WeatherUi().render(true)
        Fal.setSetting('uiVisible', true)
      }
    } else if (Fal.getSetting('uiVisible', false) === true) {
      Fal.getModule().uiApp = await new WeatherUi().render(true)
    }
  }

  /**
   * TODO
   */
  static async _updateTimeHeadline() {
    Logger.debug('WeatherUi._updateTimeHeadline()', { 'model': WeatherUi._weatherModel })
    if (WeatherUi._weatherModel.hasTimeAuthority) {
      WeatherUi._weatherModel.timeHeadline = TimeProvider.getI18nDateString()
      $('#weatherHeadline').html(WeatherUi._weatherModel.timeHeadline)
    }
  }

  /**
   * This helper is invoked by the Hook on events to update the stored weatherModel
   * if provided. If no weatherModel is provided, the stored static on the class
   * is used instead.
   * 
   * @param {Object} weatherModel - the optional weatherModel to update the UI to.
   */
  static async update(weatherModel = null) {
    if (weatherModel == null) weatherModel = WeatherUi._weatherModel
    Logger.debug('WeatherUi.update(...)', { 'weatherModel': weatherModel })
    WeatherUi._weatherModel = weatherModel

    // get last used perception if from user or apply an allowed one to the user
    if (!WeatherUi._perceptionId) {
      WeatherUi._perceptionId = Fal.getUserFlag('perceptionId', undefined)
      const percieverIds = WeatherPerception.getAllowedIds(Fal.userID())
      if (!percieverIds.includes(WeatherUi._perceptionId)) {
        WeatherUi._perceptionId = percieverIds[0]
      }
      await Fal.setUserFlag('perceptionId', WeatherUi._perceptionId)
    }

    WeatherUi._addModelFlags()
    if (Fal.getSetting('uiVisible', false) === true) {
      const weatherInfoHtml = await WeatherPerception.getAsUiHtml(WeatherUi._perceptionId, WeatherUi._weatherModel)
      $('#weatherDetail').html(weatherInfoHtml)
      if (WeatherUi._weatherModel.hasTimeAuthority) WeatherUi._updateTimeHeadline()
    }
  }
}

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
import { MODULE } from './constants.js'
import { SceneWeather } from './sceneWeather.js'

Hooks.on(MODULE.LCCNAME + 'WeatherUpdated', async (data) => {
  Logger.debug('->Hook:WeatherUpdated -> WeatherUI.update(...)')
  // TODO only for GMs?
  if (data.sceneId == canvas.scene._id && data.info !== undefined) {
    WeatherUi.update(data.info)
  }
})

Hooks.on('renderWeatherUi', () => {
  Logger.debug('->Hook:renderWeatherUi')
  WeatherUi.update()
})

/**
 * Helper clsss for the weather configuration tab on the scene settings dialog.
 */
export class WeatherUi extends FormApplication {
  static _isOpen = false
  static _weatherInfo = {}

  async _render(force = false, options = {}) {
    await super._render(force, options)
    if (game.settings.get(MODULE.ID, 'uiPinned')) {
      WeatherUi.pinApp()
    }
    WeatherUi._isOpen = true
    // Remove the window from candidates for closing via Escape.
    delete ui.windows[this.appId]
  }

  // Override original #close method inherited from parent class.
  async close(options = {}) {
    // If called by scene weather, record that it is not longer visible.
    if (options.sceneWeather) {
      WeatherUi._isOpen = false
      game.settings.set(MODULE.ID, 'uiVisible', false)

    }
    return super.close(options)
  }

  constructor() {
    super()
  }

  static get defaultOptions() {
    const playerApp = document.getElementById('players')
    // const playerAppPos = playerApp.getBoundingClientRect()

    this.initialPosition = game.settings.get(MODULE.ID, 'uiPosition')

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
      title: 'SceneWeather',
      top: this.initialPosition.top,
      left: this.initialPosition.left,
    })
  }

  async _updateObject(event, formData) {
    // TODO
    Logger.debug('WeatherUi._updateObjec', { 'event': event, 'formData': formData })
  }

  getData() {
    // let sceneWeather = game.sceneWeather.get()
    // return sceneWeather.getWeatherInfo()
    return WeatherUi._weatherInfo
  }

  activateListeners(html) {
    super.activateListeners(html);

    const dragHandle = html.find('#dragHandle')[0];
    const drag = new Draggable(this, html, dragHandle, false);

    // Pin zone is the "jiggle area" in which the app will be locked
    // to a pinned position if dropped. pinZone stores whether or not
    // we're currently in that area.
    let pinZone = false;

    // Have to override this because of the non-standard drag handle, and
    // also to manage the pin lock zone and animation effects.
    drag._onDragMouseMove = function _newOnDragMouseMove(event) {
      event.preventDefault();

      const playerApp = document.getElementById('players');
      const playerAppPos = playerApp.getBoundingClientRect();

      // Limit dragging to 60 updates per second.
      const now = Date.now();
      if (now - this._moveTime < 1000 / 60) return;
      this._moveTime = now;

      // When unpinning, make the drag track from the existing location in screen space
      const { left, top } = this.element.getBoundingClientRect();
      if (WeatherUi.unPinApp()) {
        Object.assign(this.position, { left, top });
      }

      // Follow the mouse.
      this.app.setPosition({
        left: this.position.left + (event.clientX - this._initial.x),
        top: this.position.top + (event.clientY - this._initial.y),
      });

      // Defining a region above the PlayerList that will trigger the jiggle.
      let playerAppUpperBound = playerAppPos.top - 50;
      let playerAppLowerBound = playerAppPos.top + 50;

      if (
        event.clientX > playerAppPos.left &&
        event.clientX < playerAppPos.left + playerAppPos.width &&
        event.clientY > playerAppUpperBound &&
        event.clientY < playerAppLowerBound
      ) {
        $('#scene-weather-app').css('animation', 'jiggle 0.2s infinite');
        pinZone = true;
      } else {
        $('#scene-weather-app').css('animation', '');
        pinZone = false;
      }
    };

    drag._onDragMouseUp = async function _newOnDragMouseUp(event) {
      event.preventDefault();

      window.removeEventListener(...this.handlers.dragMove);
      window.removeEventListener(...this.handlers.dragUp);

      const playerApp = document.getElementById('players');
      const playerAppPos = playerApp.getBoundingClientRect();
      let myOffset = playerAppPos.height + 50; // TODO Pin Offset

      // If the mouseup happens inside the Pin zone, pin the app.
      if (pinZone) {
        WeatherUi.pinApp();
        await game.settings.set(MODULE.ID, 'uiPinned', true);
        this.app.setPosition({
          left: 15,
          top: window.innerHeight - myOffset,
        });
      } else {
        let windowPos = $('#scene-weather-app').position();
        let newPos = { top: windowPos.top, left: windowPos.left };
        await game.settings.set(MODULE.ID, 'uiPosition', newPos);
        await game.settings.set(MODULE.ID, 'uiPinned', false);
      }

      // Kill the jiggle animation on mouseUp.
      $('#scene-weather-app').css('animation', '');
    };

  }

  // Pin the app above the Players list inside the ui-left container.
  static async pinApp() {
    const app = game.modules.get(MODULE.ID).uiApp;
    if (app && !app.element.hasClass('pinned')) {
      $('#players').before(app.element);
      app.element.addClass('pinned');
    }
  }

  // Un-pin the app.
  static unPinApp() {
    const app = game.modules.get(MODULE.ID).uiApp;
    if (app && app.element.hasClass('pinned')) {
      const element = app.element;
      $('body').append(element);
      element.removeClass('pinned');

      return true;
    }
  }

  // Toggle visibility of the main window.
  static async toggleAppVis(mode) {
    //TODO check wether player is allowed to view weather
    if (mode === 'toggle') {
      if (game.settings.get(MODULE.ID, 'uiVisible') === true) {
        // Stop any currently-running animations, and then animate the app
        // away before close(), to avoid the stock close() animation.
        $('#scene-weather-app').stop();
        $('#scene-weather-app').css({ animation: 'close 0.3s', opacity: '0' });
        setTimeout(function () {
          // Pass an object to .close() to indicate that it came from SceneWeather
          // itself istead of an Esc keypress.
          game.modules.get(MODULE.ID).uiApp.close({ sceneWeather: true });
        }, 200);
      } else {
        // Make sure there isn't already an instance of the app rendered.
        // Fire off a close() just in case, clears up some stuck states.
        if (WeatherUi._isOpen) {
          game.modules.get(MODULE.ID).uiApp.close({ sceneWeather: true });
        }
        game.modules.get(MODULE.ID).uiApp = await new WeatherUi().render(true);
        game.settings.set(MODULE.ID, 'uiVisible', true);
      }
    } else if (game.settings.get(MODULE.ID, 'uiVisible') === true) {
      game.modules.get(MODULE.ID).uiApp = await new WeatherUi().render(true);
    }
  }

  static async update(weatherInfo = null) {
    if (weatherInfo == null) weatherInfo = WeatherUi._weatherInfo
    Logger.debug('WeatherUi.update(...)', { 'weatherInfo': weatherInfo })
    WeatherUi._weatherInfo = weatherInfo
    if (game.settings.get(MODULE.ID, 'uiVisible') === true) {
      // TODO depending on user setting for precision
      const weatherInfoHtml = SceneWeather.getPerceptiveWeatherI18n(weatherInfo)
      $('#weatherInfo').html(weatherInfoHtml);
    }
  }
}

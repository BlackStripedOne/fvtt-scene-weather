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
import { EVENTS, MODULE, GENERATOR_MODES } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { MeteoCanvas } from './meteo/canvas.js'
import { MeteoWind } from './meteo/wind.js'
import { MeteoTemp } from './meteo/temp.js'
import { MeteoClouds } from './meteo/clouds.js'
import { MeteoPreci } from './meteo/preci.js'
import { MeteoPointer } from './meteo/pointer.js'
import { MeteoDaylight } from './meteo/daylight.js'
import { SliderMapper } from './meteo/sliderMapper.js'
import { MeteoLegend } from './meteo/legend.js'
import { TimeProvider } from '../time/timeProvider.js'
import { Permissions } from '../permissions.js'

Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  // TODO only for GMs?
  if (data.sceneId == canvas.scene._id && data.model !== undefined) {
    // Fal.getModule().meteoApp.update()
    MeteoUi.update()
  }
})

Hooks.on('updateWorldTime', async () => {
  // TODO only for GMs?
  if (canvas.scene) {
    // Fal.getModule().meteoApp.update()
    MeteoUi.updatePointer()
  }
})

Hooks.on('renderMeteoUi', () => {
  MeteoUi.update()
})

/**
 * Implementation of the meteogram UI
 */
export class MeteoUi extends FormApplication {
  static _isOpen = false

  _fromHr = -72

  _toHr = 144

  hSplitTop = 220
  hSplitBottom = 280
  vSplitLeft = 60
  vSplitRight = 540

  /**
   * @type {PIXI.Application|undefined}
   */
  _app

  /**
   * @type {PIXI.Container|undefined}
   */
  _meteoContainer

  _meteoContainerElements = []

  _meteoPointer

  _sliderMapper

  /* --------------------- static ----------------------- */

  /**
   * @param slider HtmlElement with an initialized slider
   * @param threshold Minimum proximity (in percentages) to merge tooltips
   * @param separator String joining tooltips
   */
  static _mergeTooltips(slider, threshold, separator) {
    var textIsRtl = getComputedStyle(slider).direction === 'rtl'
    var isRtl = slider.noUiSlider.options.direction === 'rtl'
    var isVertical = slider.noUiSlider.options.orientation === 'vertical'
    var tooltips = slider.noUiSlider.getTooltips()
    var origins = slider.noUiSlider.getOrigins()

    // Move tooltips into the origin element. The default stylesheet handles this.
    for (const [index, tooltip] of tooltips.entries()) {
      if (tooltip) {
        origins[index].appendChild(tooltip)
      }
    }

    slider.noUiSlider.on('update', function (values, _handle, _unencoded, _tap, positions) {
      var pools = [[]]
      var poolPositions = [[]]
      var poolValues = [[]]
      var atPool = 0

      // Assign the first tooltip to the first pool, if the tooltip is configured
      if (tooltips[0]) {
        pools[0][0] = 0
        poolPositions[0][0] = positions[0]
        poolValues[0][0] = MeteoUi._formatRange(values[0])
      }

      for (var i = 1; i < positions.length; i++) {
        if (!tooltips[i] || positions[i] - positions[i - 1] > threshold) {
          atPool++
          pools[atPool] = []
          poolValues[atPool] = []
          poolPositions[atPool] = []
        }

        if (tooltips[i]) {
          pools[atPool].push(i)
          poolValues[atPool].push(MeteoUi._formatRange(values[i]))
          poolPositions[atPool].push(positions[i])
        }
      }

      for (const [poolIndex, pool] of pools.entries()) {
        var handlesInPool = pool.length

        for (var j = 0; j < handlesInPool; j++) {
          var handleNumber = pool[j]

          if (j === handlesInPool - 1) {
            var offset = 0

            for (const value of poolPositions[poolIndex]) {
              offset += 1000 - value
            }

            var direction = isVertical ? 'bottom' : 'right'
            var last = isRtl ? 0 : handlesInPool - 1
            var lastOffset = 1000 - poolPositions[poolIndex][last]
            offset = (textIsRtl && !isVertical ? 100 : 0) + offset / handlesInPool - lastOffset

            // Center this tooltip over the affected handles
            tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator)
            tooltips[handleNumber].style.display = 'block'
            tooltips[handleNumber].style[direction] = offset + '%'
          } else {
            // Hide this tooltip
            tooltips[handleNumber].style.display = 'none'
          }
        }
      }
    })
  }

  /**
   * Formats a time range value into a human-readable string.
   * @param {number} value - The time range value in hours.
   * @returns {string} The formatted time range string.
   */
  static _formatRange(value) {
    if (value == 0) return Fal.i18n('dialogs.meteoUi.range.now')
    const ago = value < 0
    value = Math.abs(value)
    const days = Math.trunc(value / 24)
    const hours = Math.trunc(value - days * 24)
    const fString =
      (days > 0 ? days + ' ' + Fal.i18n('dialogs.meteoUi.range.days') : '') +
      (days > 0 && hours > 0 ? ', ' : '') +
      (hours > 0 ? hours + ' ' + Fal.i18n('dialogs.meteoUi.range.hours') : '')
    return (ago ? Fal.i18n('dialogs.meteoUi.range.agoPrep') : '') + fString + (ago ? Fal.i18n('dialogs.meteoUi.range.agoPost') : '')
  }

  /** @override */
  static get defaultOptions() {
    this.initialPosition = Fal.getSetting('meteoPosition', { top: 40, left: 40 })
    return Utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      width: 600,
      height: 375,
      submitOnChange: false,
      closeOnSubmit: false,
      minimizable: false,
      template: 'modules/' + MODULE.ID + '/templates/meteoUi.hbs',
      id: 'scene-weather-meteo-app',
      title: 'SceneWeather Meteogram',
      top: this.initialPosition.top,
      left: this.initialPosition.left
    })
  }

  /**
   * Toggle visibility of the main window, the mode is set to 'toggle' otherwise
   * the main window of the UI will be set visible if it is set visible in the
   * settings.
   *
   * @param {String} mode - the optional mode for setting the app visible
   */
  static async toggleAppVis(mode) {
    //TODO check wether player is allowed to view weather
    if (mode === 'toggle') {
      if (Fal.getSetting('meteoVisible', false) === true) {
        // Stop any currently-running animations, and then animate the app
        // away before close(), to avoid the stock close() animation.
        $('#scene-weather-meteo-app').stop()
        $('#scene-weather-meteo-app').css({ animation: 'close 0.3s', opacity: '0' })
        setTimeout(function () {
          // Pass an object to .close() to indicate that it came from SceneWeather
          // itself istead of an Esc keypress.
          Fal.getModule().meteoApp.close({ sceneWeather: true })
        }, 200)
      } else {
        // Make sure there isn't already an instance of the app rendered.
        // Fire off a close() just in case, clears up some stuck states.
        if (MeteoUi._isOpen) {
          Fal.getModule().meteoApp.close({ sceneWeather: true })
        }
        Fal.getModule().meteoApp = await new MeteoUi().render(true)
        // await Fal.getModule().meteoApp.render(true)
        Fal.setSetting('meteoVisible', true)
      }
    } else if (Fal.getSetting('meteoVisible', false) === true) {
      Fal.getModule().meteoApp = await new MeteoUi().render(true)
      //await new MeteoUi().render(true)
    }
  }

  /**
   * Updates the Meteo UI module.
   * @returns {Promise<void>} A Promise that resolves once the update is complete.
   */
  static async update() {
    Logger.trace('MeteoUi.update()')
    if (Fal.getSetting('meteoVisible', false) === true && Fal.getModule().meteoApp) {
      Fal.getModule().meteoApp._drawWeatherModelData()
    }

    if (
      Permissions.hasPermission(Fal.userID(), 'meteogramUi') &&
      [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))
    ) {
      $('#scene-weather-meteo-app').css('visibility', 'visible')
    } else {
      $('#scene-weather-meteo-app').css('visibility', 'hidden')
    }
  }

  /**
   * Updates the pointer for the Meteo UI module.
   * This function is responsible for updating the pointer in the Meteo UI module,
   * if the Meteo module is visible and initialized.
   * It retrieves the Meteo app instance and calls the necessary update functions.
   */
  static async updatePointer() {
    if (Fal.getSetting('meteoVisible', false) === true && Fal.getModule().meteoApp) {
      const app = Fal.getModule().meteoApp
      if (app._meteoPointer) {
        Logger.debug('MeteoUi.updatePointer', { app: app })
        app._meteoPointer.update([], app._fromHr, app._toHr)
        app._sliderMapper.update(app._fromHr, app._toHr)
      }
    }
  }

  /**
   * Creates a new instance of the MeteoApp class and assigns the FormApplication to the
   * parameter 'meteoApp' of the module instance.
   * @constructor
   */
  constructor() {
    super()
    Fal.getModule().meteoApp = this
  }

  /* --------------------- Functions, public ----------------------- */

  /**
   * Sets up the event listeners for the form.
   * @param {jQuery} jQ - The jQuery object of the form.
   */
  activateListeners(jQ) {
    super.activateListeners(jQ)
    // Setup pixi renderer
    const meteoCanvas = $('#meteogramCanvas')[0]
    if (meteoCanvas) {
      PIXI.settings.ROUND_PIXELS = !0

      this._app = new PIXI.Application({
        view: meteoCanvas,
        transparent: true,
        width: meteoCanvas.width,
        height: meteoCanvas.height,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
      })

      this._meteoContainer = new PIXI.Container()
      this._app.stage.addChild(this._meteoContainer)

      this._meteoContainerElements.push(
        this._meteoContainer.addChild(new MeteoDaylight(this.vSplitLeft, 0, this.vSplitRight, this.hSplitTop)),
        this._meteoContainer.addChild(new MeteoClouds(this.vSplitLeft, 0, this.vSplitRight, this.hSplitTop)),
        this._meteoContainer.addChild(new MeteoCanvas(this.vSplitLeft, 0, this.vSplitRight, this.hSplitTop)),
        this._meteoContainer.addChild(new MeteoWind(this.vSplitLeft, this.hSplitTop - 20, this.vSplitRight, 20, false)),
        this._meteoContainer.addChild(new MeteoTemp(this.vSplitLeft, 0, this.vSplitRight, this.hSplitTop)),
        this._meteoContainer.addChild(new MeteoPreci(this.vSplitLeft, this.hSplitTop, this.vSplitRight, this.hSplitBottom - this.hSplitTop))
      )
      this._meteoPointer = new MeteoPointer(this.vSplitLeft, 0, this.vSplitRight, this.hSplitBottom)
      this._meteoContainerElements.push(
        this._meteoContainer.addChild(this._meteoPointer),
        this._meteoContainer.addChild(new MeteoLegend(0, 0, this.vSplitLeft, this.hSplitBottom))
      )

      this._sliderMapper = this._meteoContainer.addChild(new SliderMapper(0, this.hSplitBottom, 600, 20, this.vSplitLeft, 600))
    } else {
      Logger.debug('No canvas yet for initializing the MeteoUI App.')
    }

    // inject noUISliders
    jQ.find('.sceneweather-slider').each(function (__id) {
      const sliderJQ = $(this)
      const meteoApp = Fal.getModule().meteoApp
      // eslint-disable-next-line no-undef
      noUiSlider.create(sliderJQ[0], {
        start: [meteoApp._fromHr, 0, meteoApp._toHr],
        tooltips: [true, true, true],
        behaviour: 'drag-all',
        step: 1,
        margin: 6,
        padding: 0,
        connect: true,
        range: {
          min: -72,
          max: 144
        },
        pips: {
          mode: 'range',
          density: 1,
          format: {
            to: function (value) {
              return Math.trunc(value / 24)
            },
            from: function (value) {
              return value * 24
            }
          },
          filter: (value, __type) => {
            if (value === -72 || value === 144) {
              return 2 // small value
            } else if (value === 0) {
              return -1 // no pip at all
            } else {
              if (value % 24 === 0) {
                return 0 // no value
              } else {
                return -1 // no pip at all
              }
            }
          }
        }
      })

      // disable the now slider
      sliderJQ[0].noUiSlider.disable(1)
      // attach tooltop merging
      MeteoUi._mergeTooltips(sliderJQ[0], 10, ' - ')
      // attach interaction to sliders for updates
      sliderJQ[0].noUiSlider.on('update', function (values, __handle, __unencoded, __tap, __positions) {
        meteoApp._fromHr = Number(values[0])
        meteoApp._toHr = Number(values[2])
        meteoApp._drawWeatherModelData()
      })
    })

    // window dragger
    const dragHandle = jQ.find('#dragHandle')[0]
    const drag = new Draggable(this, jQ, dragHandle, false)

    // Have to override this because of the non-standard drag handle, and
    // also to manage the pin lock zone and animation effects.
    drag._onDragMouseMove = function _newOnDragMouseMove(event) {
      event.preventDefault()

      // Limit dragging updates
      Utils.throttleInteractivity(this.app)

      // Follow the mouse.
      this.app.setPosition({
        left: this.position.left + (event.clientX - this._initial.x),
        top: this.position.top + (event.clientY - this._initial.y)
      })
    }

    drag._onDragMouseUp = async function _newOnDragMouseUp(event) {
      event.preventDefault()

      window.removeEventListener(...this.handlers.dragMove)
      window.removeEventListener(...this.handlers.dragUp)

      let windowPos = $('#scene-weather-meteo-app').position()
      let newPos = { top: windowPos.top, left: windowPos.left }
      await Fal.setSetting('meteoPosition', newPos)
    }
  }

  /* --------------------- Functions, private ----------------------- */

  /** @override */
  async _render(force = false, options = {}) {
    await super._render(force, options)
    MeteoUi._isOpen = true
    this._drawWeatherModelData()
    // Remove the window from candidates for closing via Escape.
    delete ui.windows[this.appId]
    // hide the app when we have weather DISABLED
    if (
      Permissions.hasPermission(Fal.userID(), 'meteogramUi') &&
      [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(Fal.getSceneFlag('weatherMode', GENERATOR_MODES.DISABLED))
    ) {
      $('#scene-weather-meteo-app').css('visibility', 'visible')
    } else {
      $('#scene-weather-meteo-app').css('visibility', 'hidden')
    }
  }

  /**
   * Override original #close method inherited from parent class.
   * @override
   */
  async close(options = {}) {
    Logger.trace('MeteoUi.close(...)', { options: options })
    // If called by scene weather, record that it is not longer visible.
    if (options.sceneWeather) {
      this._isOpen = false
      Fal.setSetting('meteoVisible', false)
    }
    return super.close(options)
  }

  /**
   * Retrieves decluttered data based on the specified parameters.
   * @param {number} start - The start hour.
   * @param {number} end - The end hour.
   * @param {number} [width=600] - The width of the container.
   * @param {number} [declutterSpacing=20] - The spacing between decluttered elements.
   * @returns {Array<Object>} - The decluttered data array.
   */
  _getDeclutteredData(start, end, width = 600, declutterSpacing = 20) {
    const hourAmount = 0 - start + end
    const declutterSpace = width / declutterSpacing
    let hourCount = TimeProvider.getHourOfDay(0, start) - 1
    let declutteredData = [
      {
        isDayLine: false,
        isHourLine: false,
        hourCount: hourCount - 1,
        xPos: -1 * (width / hourAmount),
        weatherModel: SceneWeather.getWeatherModel(0, start - 1)
      }
    ]
    for (let hour = start; hour <= end; hour++) {
      hourCount++
      if (hourCount % 16 == 0) {
        if (hourAmount / 16 > declutterSpace) continue
      } else if (hourCount % 8 == 0) {
        if (hourAmount / 8 > declutterSpace) continue
      } else if (hourCount % 4 == 0) {
        if (hourAmount / 4 > declutterSpace) continue
      } else if (hourCount % 2 == 0) {
        if (hourAmount / 2 > declutterSpace) continue
      } else {
        if (hourAmount > declutterSpace) continue
      }
      declutteredData.push({
        isDayLine: TimeProvider.getHourOfDay(0, hour) === 0,
        isHourLine: hourAmount < declutterSpace,
        hourCount: hourCount,
        xPos: (-start + hour) * (width / hourAmount),
        weatherModel: SceneWeather.getWeatherModel(0, hour)
      })
    }
    declutteredData.push({
      isDayLine: false,
      isHourLine: false,
      hourCount: hourCount + 1,
      xPos: (-start + end + 1) * (width / hourAmount),
      weatherModel: SceneWeather.getWeatherModel(0, end + 1)
    })
    return declutteredData
  }

  /**
   * Draws weather model data on the interface by calling all registered canvas plugins in order.
   * @returns {Promise<void>} A promise that resolves once the weather model data is drawn.
   */
  async _drawWeatherModelData() {
    // Limit updates updates
    Utils.throttleInteractivity(this)
    // bail if not initialized yet
    if (!this._meteoContainer) return

    const graphData = this._getDeclutteredData(this._fromHr, this._toHr, this.vSplitRight, 20)
    if (!graphData || graphData.length === 0) return

    for (const meteoContainerElement of this._meteoContainerElements) {
      meteoContainerElement.update(graphData, this._fromHr, this._toHr)
    }
    this._sliderMapper.update(this._fromHr, this._toHr)
    this._app.render()
  }
}

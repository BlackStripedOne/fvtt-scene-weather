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
import { EVENTS, MODULE } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  // TODO only for GMs?
  if (data.sceneId == canvas.scene._id && data.model !== undefined) {
    MeteoUi.update()
  }
})

/**
 * TODO
 */
export class MeteoUi extends FormApplication {
  static _isOpen = false

  static _context = undefined

  static _fromHr = -12

  static _toHr = 12

  constructor() {
    super()
  }

  async _render(force = false, options = {}) {
    await super._render(force, options)
    MeteoUi._isOpen = true
    MeteoUi._context = document.getElementById('meteogramCanvas')
    MeteoUi._chart = undefined
    MeteoUi._drawWeatherModelData()
    // Remove the window from candidates for closing via Escape.
    delete ui.windows[this.appId]
  }

  // Override original #close method inherited from parent class.
  async close(options = {}) {
    // If called by scene weather, record that it is not longer visible.
    if (options.sceneWeather) {
      MeteoUi._isOpen = false
      MeteoUi._context = undefined
      Fal.setSetting('meteoVisible', false)
    }
    return super.close(options)
  }

  static get defaultOptions() {
    this.initialPosition = Fal.getSetting('meteoPosition', { top: 40, left: 40 })
    return Utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      width: 600,
      height: 400,
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

  async _updateObject(event, formData) {
    // TODO
    Logger.debug('MeteoUi._updateObjec', { event: event, formData: formData })
  }

  getData() {
    return {}
  }

  activateListeners(html) {
    super.activateListeners(html)

    const dragHandle = html.find('#dragHandle')[0]
    const drag = new Draggable(this, html, dragHandle, false)

    // Have to override this because of the non-standard drag handle, and
    // also to manage the pin lock zone and animation effects.
    drag._onDragMouseMove = function _newOnDragMouseMove(event) {
      event.preventDefault()

      // Limit dragging to 60 updates per second.
      const now = Date.now()
      if (now - this._moveTime < 1000 / 60) return
      this._moveTime = now

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

  // Toggle visibility of the main window.
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
        await Fal.setSetting('meteoVisible', true)
      }
    } else if (Fal.getSetting('meteoVisible', false) === true) {
      Fal.getModule().meteoApp = await new MeteoUi().render(true)
    }
  }

  static async update() {
    Logger.debug('Updating MeteoUi')
    if (Fal.getSetting('meteoVisible', false) === true) {
      MeteoUi._drawWeatherModelData()
    }
  }

  static async _drawWeatherModelData() {
    const fromHr = MeteoUi._fromHr
    const toHr = MeteoUi._toHr
    const ctx = MeteoUi._context
    if (ctx === undefined) {
      Logger.debug('No Context Yet')
      return
    }

    let data = {
      labels: [],
      datasets: []
    }

    let tempGround = {
      label: 'tempGround',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      borderColor: '#ff0000',
      borderDash: [5, 5],
      yAxisID: 'y'
    }
    let tempAir = {
      label: 'tempAir',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      borderColor: '#ff4400',
      borderDash: [5, 5],
      yAxisID: 'y'
    }
    let tempPercieved = {
      label: 'tempPercieved',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      borderColor: '#ff0044',
      yAxisID: 'y'
    }
    let windSpeed = {
      label: 'windSpeed',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      borderColor: 'rgba(20, 200, 0, 0.9)',
      yAxisID: 'y'
    }
    let windGusts = {
      label: 'windGusts',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      borderColor: 'rgba(0, 200, 0, 0.8)',
      borderDash: [5, 5],
      yAxisID: 'y'
    }
    let windDirection = {
      label: 'windDirection',
      data: [],
      borderWidth: 1,
      showLine: false,
      borderColor: '#b74'
    }
    let cloudsCoverage = {
      label: 'cloudsCoverage',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      backgroundColor: 'rgba(128, 128, 128, 0.3)',
      fill: true,
      stepped: true,
      yAxisID: 'y2'
    }
    //    let cloudsBottom = { label: 'cloudsBottom', data: [], borderWidth: 1, pointRadius: 0, borderColor: '#222' }
    //    let cloudsTop = { label: 'cloudsTop', data: [], borderWidth: 1, pointRadius: 0, borderColor: '#222' }
    //    let cloudsType = { label: 'cloudsType', data: [], borderWidth: 1, showLine: false, borderColor: '#555' }
    let precipitationAmount = {
      label: 'precipitationAmount',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      backgroundColor: 'rgba(60,60,255,0.2)',
      fill: true,
      yAxisID: 'y2'
    }
    let sunAmount = {
      label: 'sunAmount',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      backgroundColor: 'rgba(255, 255, 0, 0.6)',
      fill: true,
      yAxisID: 'y2'
    }
    let humidity = {
      label: 'humidity',
      data: [],
      borderWidth: 1,
      pointRadius: 0,
      borderColor: '#9999ff',
      yAxisID: 'y2'
    }

    // TODO !!!
    const sceneWeather = SceneWeatherApi.getSceneWeatherProvider()

    for (let hour = fromHr; hour < toHr; hour++) {
      const meteoData = sceneWeather.weatherModel.getWeatherData(0, hour)

      tempGround.data.push(meteoData.temp.ground)
      tempAir.data.push(meteoData.temp.air)
      tempPercieved.data.push(meteoData.temp.percieved)
      windSpeed.data.push(meteoData.wind.speed)
      windGusts.data.push(meteoData.wind.gusts)
      windDirection.data.push(meteoData.wind.direction / 10)
      cloudsCoverage.data.push(meteoData.clouds.coverage * 100)
      //       cloudsBottom.data.push(meteoData.clouds.bottom)
      //       cloudsTop.data.push(meteoData.clouds.top)
      //       cloudsType.data.push(meteoData.clouds.type * 10)
      precipitationAmount.data.push(meteoData.precipitation.amount * 100)
      sunAmount.data.push(meteoData.sun.amount * 100)
      humidity.data.push(meteoData.humidity)

      if (hour < 0) {
        data.labels.push(hour + 'h')
      } else if (hour > 0) {
        data.labels.push('+' + hour + 'h')
      } else {
        data.labels.push('now')
      }
      //        data.labels.push(TimeProvider.getMonthOfYearFromTimeHash(regionData.timeHash) + '.' + TimeProvider.getDayOfMonthFromTimeHash(regionData.timeHash) + ' ' + TimeProvider.getTimeOfDayFromTimeHash(regionData.timeHash) + ':00')
    }

    data.datasets.push(tempGround)
    data.datasets.push(tempAir)
    data.datasets.push(tempPercieved)
    data.datasets.push(windSpeed)
    data.datasets.push(windGusts)
    data.datasets.push(windDirection)
    data.datasets.push(cloudsCoverage)
    //   data.datasets.push(cloudsBottom)
    //   data.datasets.push(cloudsTop) //   data.datasets.push(cloudsType)
    data.datasets.push(precipitationAmount)
    data.datasets.push(sunAmount)
    data.datasets.push(humidity)

    let config = {
      type: 'line',
      data: data,
      options: {
        layout: {
          autoPadding: false
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true
            }
          }
        },
        responsive: false,
        animation: false,
        scales: {
          x: {
            position: 'bottom'
          },
          y: {
            display: true,
            position: 'left',
            type: 'linear',
            min: -30,
            max: 70,
            title: {
              display: true,
              text: '°C'
            },
            grid: {
              color: function (context) {
                if (context.tick.value == 0) {
                  return 'rgba(0,0,0,1)'
                } else {
                  return 'rgba(80,80,80,0.3)'
                }
              }
            }
          },
          y2: {
            position: 'right',
            type: 'linear',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: '%'
            }
          }
        }
      }
    }

    if (MeteoUi._chart === undefined) {
      MeteoUi._chart = new Chart(ctx, config)
      Logger.debug('MeteoUI::new', { ctx: ctx, chart: MeteoUi._chart })
    } else {
      Logger.debug('MeteoUi::update')
      for (let i = 0; i < MeteoUi._chart.data.datasets.length; i++) {
        MeteoUi._chart.data.datasets[i].data = data.datasets[i].data
      }
      MeteoUi._chart.data.labels = data.labels
      MeteoUi._chart.update()
    }
  }
}

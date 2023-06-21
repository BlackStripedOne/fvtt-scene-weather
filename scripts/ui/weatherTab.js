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
import { MODULE, RAIN_MODES, GENERATOR_MODES } from '../constants.js'
import { RegionConfigDialog } from '../dialogs/regionConfig.js'
import { WeatherConfigDialog } from '../dialogs/weatherConfig.js'
import { WeatherModel } from '../weatherModel.js'
import { RegionMeteo } from '../regionMeteo.js'
import { SceneWeatherState } from '../state.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { TimeProvider } from '../time/timeProvider.js'

/**
 * Helper clsss for the weather configuration tab on the scene settings dialog.
 */
// eslint-disable-next-line unicorn/no-static-only-class
export class WeatherTab {
  /**
   * Injects the control tab to the scene configuration dialog
   * @param {*} app - the dialog application instance
   * @param {*} jQ - the jQuery instance of the html where the tab shall be injected
   */
  static async addControlsTab(app, jQ) {
    const weatherSettings = app.document.flags[MODULE.ID]
    const defaultOptions = {
      weatherMode: 'disabled',
      weatherTemplate: Object.values(SceneWeatherState._weatherTemplates)[0].id,
      regionTemplate: Object.values(SceneWeatherState._regionTemplates)[0].id,
      timeProvider: TimeProvider.getProviderIds()[0],
      seed: ''
    }

    const tabData = {
      data: Utils.mergeObject(defaultOptions, weatherSettings, { overwrite: true }),
      timeProviders: TimeProvider.getProviderIds().map((element) => {
        return {
          id: element,
          name: 'configTab.general.timeSources.' + element + '.name',
          hint: 'configTab.general.timeSources.' + element + '.hint' // TODO write hints to html, then use attachedListener on select change to display hint, depending on which is selected
        }
      }),
      rainModes: Object.values(RAIN_MODES).map((element) => {
        return {
          id: element,
          name: 'configTab.rainModes.' + element + '.name',
          hint: 'configTab.rainModes.' + element + '.hint' // TODO write hints to html, then use attachedListener on select change to display hint, depending on which is selected
        }
      }),
      weatherModes: Object.values(GENERATOR_MODES).map((element) => {
        return {
          id: element,
          name: 'configTab.weatherModes.' + element + '.name',
          hint: 'configTab.weatherModes.' + element + '.hint' // TODO write hints to html, then use attachedListener on select change to display hint, depending on which is selected
        }
      }),
      weatherTemplates: WeatherModel.getTemplates(),
      regionTemplates: RegionMeteo.getTemplates()
    }

    const tabHtml = await renderTemplate('modules/' + MODULE.ID + '/templates/weatherTab.hbs', tabData)

    // inject the weather tab
    $('.sheet-tabs', jQ).append(
      $('<a>')
        .addClass('item')
        .attr('data-tab', 'weather')
        .html('<i class="fas fa-solid fa-cloud-bolt-sun"></i> ' + Fal.i18n('configTab.title'))
    )
    let tab = $('<div>').addClass('tab').attr('data-tab', 'weather').insertAfter($('div[data-tab="ambience"]', jQ))
    tab.append(tabHtml)

    // activate listeners
    WeatherTab.activateListeners(app, jQ, tabData.data.weatherMode)
  }

  /**
   * Activate all listeners for the injected tab on the dialog
   * @param {*} app - the dialog application instance
   * @param {*} jQ - the jQuery instance of the html where the tab shall be injected
   * @param {*} selectedMode - the id of the current selected mode for preselection and showing/hiding the others
   */
  static activateListeners(app, jQ, selectedMode) {
    // initial selection
    jQ.find('div[id="sceneWeather.mode.' + selectedMode + '"]').addClass('active')
    jQ.find('div[id="not_sceneWeather.mode.' + selectedMode + '"]').removeClass('active')

    // action on click for region config button
    jQ.find('button[data-key="flags.scene-weather.regionConfig"]').on('click', function () {
      Logger.debug('Clicked Config Region for Scene', { sceneId: app.document._id })
      const dia = new RegionConfigDialog(app.document._id)
      dia.render(true)
    })

    // action on click for weather config button
    jQ.find('button[data-key="flags.scene-weather.weatherConfig"]').on('click', function () {
      Logger.debug('Clicked Config Weather for Scene', { sceneId: app.document._id })
      const dia = new WeatherConfigDialog(app.document._id)
      dia.render(true)
    })

    // action on click for random seed string generation
    jQ.find('#randomSeed').on('click', async function () {
      const field = jQ.find('input[name="flags.scene-weather.seed"]')
      let words = []
      for (const line of Object.values(Utils.flattenObject(game.i18n.translations))) {
        for (const word of line.split(/(\s+)/)) {
          if (word && word.length > 5 && word.length < 13 && /^\w+$/.test(word)) words.push(word)
        }
      }
      let sentence = []
      for (var i = 0; i < 3; i++) {
        sentence.push(words[Math.floor(Math.random() * words.length)])
      }
      field.val(sentence.join(' '))
    })

    // TODO check when find yields null
    jQ.find('select[name="flags.scene-weather.weatherMode"]').on('change', function () {
      let modeId = $(this).find(':selected').val()
      jQ.find('div.sceneWeather-collapsibleModeOption').each(function () {
        if ($(this).attr('id').startsWith('not_sceneWeather.mode.')) {
          if ($(this).attr('id') == 'not_sceneWeather.mode.' + modeId) {
            $(this).removeClass('active')
          } else {
            $(this).addClass('active')
          }
        } else {
          if ($(this).attr('id') == 'sceneWeather.mode.' + modeId) {
            $(this).addClass('active')
          } else {
            $(this).removeClass('active')
          }
        }
      }) // each
      app.setPosition({ height: 'auto' })
    }) // on change
  }
}

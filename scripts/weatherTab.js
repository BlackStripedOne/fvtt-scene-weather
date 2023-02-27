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
import { RegionConfigDialog } from './regionConfig.js'
import { WeatherModel } from './weatherModel.js'
import { RegionMeteo } from './regionMeteo.js'

/**
 * Helper clsss for the weather configuration tab on the scene settings dialog.
 */
export class WeatherTab {

  /**
   * Injects the control tab to the scene configuration dialog
   * @param {*} app - the dialog application instance
   * @param {*} jQ - the jQuery instance of the html where the tab shall be injected
   */
  static async addControlsTab(app, jQ) {
    Logger.debug('addControlsTab', { 'app': app, 'jQ': jQ })

    let sceneDoc = app.document
    let weatherFlags = sceneDoc.flags[MODULE.ID]
    let defaultOptions = {
      'weatherMode': 'disabled',
      'weatherTemplate': 'default',	// via WeatherModel
      'regionTemplate': 'plains',		// via RegionMeteo
      'timeProvider': 'manual',
      'dateProvider': 'manual',
      'timeHour': 0,
      'timeSeason': 0
    }
    mergeObject(defaultOptions, weatherFlags, { overwrite: true })

    let tabData = {
      'data': defaultOptions,
      'timeSeasons': [
        {
          'id': 0,
          'name': 'Winter'
        },
        {
          'id': 90,
          'name': 'Spring'
        },
        {
          'id': 180,
          'name': 'Summer'
        },
        {
          'id': 270,
          'name': 'Fall'
        }
      ],
      'timeProviders': [
        {
          'id': 'small-time',
          'name': 'SmallTime'
        },
        {
          'id': 'simple-calendar',
          'name': 'Simple Calendar'
        },
        {
          'id': 'manual',
          'name': 'Manual'
        }
      ],
      'dateProviders': [
        {
          'id': 'simple-calendar',
          'name': 'Simple Calendar'
        },
        {
          'id': 'manual',
          'name': 'Manual'
        }

      ],
      'rainModes': [
        {
          'id': 'winddir',
          'name': 'Same as winddirection'
        },
        {
          'id': 'topdown',
          'name': 'Always straight from top to bottom'
        },
        {
          'id': 'slanted',
          'name': 'Always slanted, from top to bottom'
        },
        {
          'id': 'windinfluence',
          'name': 'Direction influenced by winddirection and speed'
        }
      ],
      'weatherModes': [
        {
          'id': 'disabled',
          'name': 'Disabled (Use foundry default ambience)',
          'hint': 'Scene Weather is disabled. All ambience effects and types are set via the foundry default settings in Ambience.'
        },
        {
          'id': 'weatherTemplate',
          'name': 'Use weather template (static)',
          'hint': 'Set a weather for the scene from a select choice of templates. The weather is static and will remain like that unless manually changed.'
        },
        {
          'id': 'regionTemplate',
          'name': 'Use region template (dynamic)',
          'hint': 'Let the weather be generated based on a selected region template from a choice list. The weather will change dynamically based on given time of day and the season in the year. If an automatic calendar or time module is installed, it will change with the flow of time.'
        },
        {
          'id': 'regionAuto',
          'name': 'Manual region settings (dynamic)',
          'hint': 'Let the weather be generated based on set attributes for the scene like mean temperature or elevation. The weather is dependant on a current time/date that needs to be provided to generate the dynamic weather based on all those parameters.'
        }
      ],
      'weatherTemplates': [],
      'regionTemplates': []
    }

    // Add available weather templates
    tabData.weatherTemplates = WeatherModel.getTemplates()
    // Add available region templates
    tabData.regionTemplates = RegionMeteo.getTemplates()
    Logger.debug('Render TabData with', { 'tabData': tabData })

    let tabHtml = await renderTemplate('modules/' + MODULE.ID + '/templates/weatherTab.hbs', tabData);

    // inject the weather tab
    $('.sheet-tabs', jQ).append($('<a>').addClass('item').attr('data-tab', "weather").html('<i class="fas fa-solid fa-cloud-bolt-sun"></i> Weather'))
    let tab = $('<div>').addClass('tab').attr('data-tab', "weather").insertAfter($('div[data-tab="ambience"]', jQ))
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
    // TODO: No super in static super.activateListeners(jQ)
    Logger.debug('WeatherTab.activateListeners', { 'app': app, 'jQ': jQ, 'select': selectedMode })

    // initial selection
    jQ.find('div[id="sceneWeather.mode.' + selectedMode + '"]').addClass('active')
    jQ.find('div[id="not_sceneWeather.mode.' + selectedMode + '"]').removeClass('active')

    // action on click for region config button
    jQ.find('button[data-key="flags.scene-weather.regionConfig"]').on('click', function () {
      Logger.debug('Clicked Config Region for Scene', { 'sceneId': app.document._id })
      const dia = new RegionConfigDialog(app.document._id)
      dia.render(true)
    })

    // TODO check when find yields null
    jQ.find('select[name="flags.scene-weather.weatherMode"]').on('change', function () {
      let modeId = $(this).find(":selected").val()
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
      })// each
      app.setPosition({ height: 'auto' });
      Logger.debug('onChange', { 'app': app, 'jQ': jQ })
    }) // on change

  }
}

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
import { MODULE, METEO } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

/**
 * A dialog form for configuring the region settings.
 * See https://foundryvtt.wiki/en/development/guides/understanding-form-applications for documentation
 */
export class RegionConfigDialog extends FormApplication {
  /**
   * Reference to the scene these settings shall be applied to. If not set, the settings shall be applied globally
   * @type {Scene|undefined}
   */
  applyToScene = undefined

  /**
   * Creates an instance of RegionConfigDialog:
   * @param {Scene|undefined} applyToScene - The Scene object to apply the settings to or undefined in case global settings shall be edited
   */
  constructor(applyToScene) {
    super()
    this.applyToScene = applyToScene
  }

  /* --------------------- static ----------------------- */

  /** @override */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: 'modules/' + MODULE.ID + '/templates/regionConfig.hbs',
      id: 'region-settings',
      title: 'dialogs.regionConfig.title',
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    })
  }

  /* --------------------- Functions, public ----------------------- */

  /**
   * Sets up the event listeners for the form.
   * @param {jQuery} jQ - The jQuery object of the form.
   */
  activateListeners(jQ) {
    super.activateListeners(jQ)

    // inject tabbing
    // Guide for Tabs: https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Extending-Dialog-with-Tabs
    const tabs = new Tabs({
      navSelector: '.tabs',
      contentSelector: '.content',
      initial: 'summer',
      callback: (instance, tabs, tabName) => { }
    })
    tabs.bind(jQ[0])

    // inject noUISliders
    jQ.find('.sceneweather-slider').each(function (id) {
      const sliderJQ = $(this)
      const minInput = jQ.find('input[name="' + sliderJQ.attr('data-min') + '"]')
      const maxInput = jQ.find('input[name="' + sliderJQ.attr('data-max') + '"]')
      const range = sliderJQ.attr('data-range') || '0,100'
      const unitString = sliderJQ.attr('data-unit') || '%'
      const min = Number(range.split(',')[0] || 0)
      const max = Number(range.split(',')[1] || min)

      noUiSlider.create(sliderJQ[0], {
        start: [minInput.val() || 0, maxInput.val() || 0],
        tooltips: [
          {
            to: function (value) {
              return value + unitString
            },
            from: function (value) {
              return Number(value.replace(unitString, ''))
            }
          },
          {
            to: function (value) {
              return value + unitString
            },
            from: function (value) {
              return Number(value.replace(unitString, ''))
            }
          }
        ],
        behaviour: 'drag-all',
        step: 1,
        margin: 0,
        padding: 0,
        connect: true,
        range: {
          min: min,
          max: max
        }
      })

      sliderJQ[0].noUiSlider.on(
        'change',
        function (values, handle, unencoded, tap, positions, noUiSlider) {
          Logger.debug('Slider Update', { values: values, noUiSlider: noUiSlider })
          minInput.val(values[0])
          maxInput.val(values[1])
        }
      )
    })
  }

  /**
   * Retrieves region configuration data for a given scene or the default region.
   * @returns {Object} An object containing weather configuration data.
   */
  getData() {
    let additionalData = {
      'const': {
        'tmin': METEO.Tmin,
        'tmax': METEO.Tmax
      },
      waterAmounts: Array.from({ length: 5 }, (_, i) => ({
        id: i * 25,
        name: `dialogs.regionConfig.waterAmounts_${i * 25}`
      }))
    }

    if (this.applyToScene === undefined) {
      // Settings default region
      Utils.mergeObject(additionalData, Fal.getSetting('defaultRegionSettings'))
      return additionalData
    } else {
      // Setting for a specific scene
      let sceneData = Fal.getSceneFlag('regionSettings', undefined, this.applyToScene)
      // if no scene data set, use game setting defaults
      if (!sceneData) sceneData = Fal.getSetting('defaultRegionSettings')
      Utils.mergeObject(additionalData, sceneData)
      return additionalData
    }
  }

  /* --------------------- Functions, private ----------------------- */

  /**
   * TODO
   * @param {*} event
   * @param {*} formData
   */
  _updateObject(event, formData) {
    const data = expandObject(formData)
    if (this.applyToScene === undefined) {
      Fal.setSetting('defaultRegionSettings', data)
    } else {
      Fal.setSceneFlag('regionSettings', data, this.applyToScene)
    }
  }
}

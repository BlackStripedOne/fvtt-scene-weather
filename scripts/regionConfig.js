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

/**
 * TODO maybe use Tabs
 * https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Extending-Dialog-with-Tabs
 *
 * See https://foundryvtt.wiki/en/development/guides/understanding-form-applications for documentation
 */
export class RegionConfigDialog extends FormApplication {

  /**
   * TODO
   * @param {*} applyToScene 
   */
  constructor(applyToScene) {
    super();
    this.applyToScene = applyToScene
    Logger.debug('RegionConfigDialog:constrctor', { 'applyToScene': applyToScene })
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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

  /**
   * TODO
   * @param {jQuery} jQ 
   */
  activateListeners(jQ) {
    super.activateListeners(jQ);
    Logger.debug('RegionConfigDialog:activateListeners')

    // inject tabbing
    const tabs = new Tabs({ navSelector: ".tabs", contentSelector: ".content", initial: "summer", callback: {} })
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
        start: [
          minInput.val() || 0,
          maxInput.val() || 0
        ],
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
          }],
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

      sliderJQ[0].noUiSlider.on('change', function (values, handle, unencoded, tap, positions, noUiSlider) {
        Logger.debug('Slider Update', { 'values': values, 'noUiSlider': noUiSlider })
        minInput.val(values[0])
        maxInput.val(values[1])
      })
    })

  }

  /**
   * TODO
   * @returns 
   */
  getData() {
    let additionalData = {
      'waterAmounts': [
        {
          'id': 0,
          'name': 'dialogs.regionConfig.waterAmounts_0'
        },
        {
          'id': 5,
          'name': 'dialogs.regionConfig.waterAmounts_5'
        },
        {
          'id': 10,
          'name': 'dialogs.regionConfig.waterAmounts_10'
        },
        {
          'id': 25,
          'name': 'dialogs.regionConfig.waterAmounts_25'
        },
        {
          'id': 50,
          'name': 'dialogs.regionConfig.waterAmounts_50'
        },
        {
          'id': 75,
          'name': 'dialogs.regionConfig.waterAmounts_75'
        },
        {
          'id': 100,
          'name': 'dialogs.regionConfig.waterAmounts_100'
        }
      ]
    }

    if (this.applyToScene === undefined) {
      // Settings default region
      mergeObject(additionalData, Utils.getSetting('defaultRegionSettings'))
      Logger.debug('RegionConfigDialog:getData(general)', { 'applyToScene': this.applyToScene, 'data': additionalData })
      return additionalData
    } else {
      // Setting for a specific scene
      let sceneData = game.scenes.get(this.applyToScene)?.getFlag(MODULE.ID, 'regionSettings') ?? undefined
      // if no scene data set, use game setting defaults
      if (!sceneData) sceneData = Utils.getSetting('defaultRegionSettings')
      mergeObject(additionalData, sceneData)
      Logger.debug('RegionConfigDialog:getData(scene)', { 'applyToScene': this.applyToScene, 'data': additionalData })
      return additionalData
    }
  }

  /**
   * TODO
   * @param {*} event 
   * @param {*} formData 
   */
  _updateObject(event, formData) {
    const data = expandObject(formData);
    // TODO also have choice between setting and scene
    Logger.debug('updateObject, regionConfig', { 'data': data, 'scene': this.applyToScene })
    if (this.applyToScene === undefined) {
      Utils.setSetting('defaultRegionSettings', data)
    } else {
      // TODO use Utils for game settings, scene Flags
      game.scenes.get(this.applyToScene).setFlag(MODULE.ID, 'regionSettings', data)
      // TODO fire event
    }
  }
}

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
      title: 'Region Settings',
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    })
  }

  /**
   * TODO
   * @param {*} html 
   */
  activateListeners(html) {
    super.activateListeners(html);
    Logger.debug('RegionConfigDialog:activateListeners')
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
          'name': 'Desert, Rocky Wasteland (0%)'
        },
        {
          'id': 5,
          'name': 'Plains, City (5%)'
        },
        {
          'id': 10,
          'name': 'Meadow, Shrubland (10%)'
        },
        {
          'id': 25,
          'name': 'Marsh, Some Rivers, Forest (25%)'
        },
        {
          'id': 50,
          'name': 'Shoreline, Huge Lake (50%)'
        },
        {
          'id': 75,
          'name': 'Small Island (75%)'
        },
        {
          'id': 100,
          'name': 'Ocean (100%)'
        }
      ]
    }

    if (this.applyToScene === undefined) {
      // Settings default region
      mergeObject(additionalData, game.settings.get(MODULE.ID, 'defaultRegionSettings'))
      Logger.debug('RegionConfigDialog:getData(general)', { 'applyToScene': this.applyToScene, 'data': additionalData })
      return additionalData
    } else {
      // Setting for a specific scene
      // TODO get setting from scene or default
      let sceneData = game.scenes.get(this.applyToScene).getFlag(MODULE.ID, 'regionSettings')
      // TODO if no scene data set, use game setting defaults
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
    // TODO use Utils for game settings, scene Flags
    if (this.applyToScene === undefined) {
      game.settings.set(MODULE.ID, 'defaultRegionSettings', data)
    } else {
      game.scenes.get(this.applyToScene).setFlag(MODULE.ID, 'regionSettings', data)
    }
  }
}

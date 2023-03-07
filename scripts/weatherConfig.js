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

import { MODULE, WIND_SPEED, CLOUD_TYPE, PRECI_TYPE } from './constants.js'
import { Logger, Utils } from './utils.js'

export class WeatherConfigDialog extends FormApplication {

  /**
   * TODO
   * @param {*} applyToScene 
   */
  constructor(applyToScene) {
    super();
    this.applyToScene = applyToScene
    Logger.debug('WeatherConfigDialog:constrctor', { 'applyToScene': applyToScene })
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: 'modules/' + MODULE.ID + '/templates/weatherConfig.hbs',
      id: 'weather-settings',
      title: 'dialogs.weatherConfig.title',
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
    Logger.debug('WeatherConfigDialog:activateListeners')

    // set initial visibilities
    const directionType = jQ.find('select[name="wind.directionType"]').find(":selected").val()
    if (directionType != 0) {
      jQ.find('#windTypeGrp').addClass('disabled')
    }
    jQ.find('select[name="wind.directionType"]').on('change', function () {
      const directionType = $(this).find(":selected").val()
      if (directionType != 0) {
        jQ.find('#windTypeGrp').addClass('disabled')
      } else {
        jQ.find('#windTypeGrp').removeClass('disabled')
      }
    })

    const cloudsType = jQ.find('select[name="clouds.type"]').find(":selected").val()
    Logger.debug('cloudsType', cloudsType)
    if (cloudsType == 0) {
      jQ.find('#cloudSectionGrp').addClass('disabled')
      jQ.find('#preciGrp').addClass('disabled')
    }
    jQ.find('select[name="clouds.type"]').on('change', function () {
      const cloudsType = $(this).find(":selected").val()
      Logger.debug('cloudsType.change', cloudsType)
      if (cloudsType == 0) {
        jQ.find('#cloudSectionGrp').addClass('disabled')
        jQ.find('#preciGrp').addClass('disabled')
      } else {
        jQ.find('#cloudSectionGrp').removeClass('disabled')
        jQ.find('#preciGrp').removeClass('disabled')
      }
    })

    const preciType = jQ.find('select[name="precipitation.type"]').find(":selected").val()
    Logger.debug('preciType', preciType)
    if (preciType == 0) {
      jQ.find('#previAmtGrp').addClass('disabled')
    }
    jQ.find('select[name="precipitation.type"]').on('change', function () {
      const preciType = $(this).find(":selected").val()
      Logger.debug('preciType', preciType)
      if (preciType == 0) {
        jQ.find('#previAmtGrp').addClass('disabled')
      } else {
        jQ.find('#previAmtGrp').removeClass('disabled')
      }
    })
  }

  /**
   * TODO
   * @returns 
   */
  getData() {
    let additionalData = {
      'windSpeeds': Object.entries(WIND_SPEED).map(([name, id]) => {
        if (name === 'hurricane') { return { 'id': 120, 'name': 'dialogs.weatherConfig.wind.speeds.hurricane' } } else { return { 'id': id, 'name': 'dialogs.weatherConfig.wind.speeds.' + name } }
      }),
      'directionTypes': [
        {
          'id': 0,
          'name': 'dialogs.weatherConfig.directionTypes.fixed'
        },
        {
          'id': 1,
          'name': 'dialogs.weatherConfig.directionTypes.noise'
        }
      ],
      'cloudsTypes': Object.entries(CLOUD_TYPE).map(([name, id]) => {
        return { 'id': id, 'name': 'dialogs.weatherConfig.clouds.types.' + name }
      }),
      'precipitationTypes': Object.entries(PRECI_TYPE).map(([name, id]) => {
        return { 'id': id, 'name': 'dialogs.weatherConfig.precipitation.types.' + name }
      }),
      'windGustTypes': [
        {
          'id': 0,
          'name': 'dialogs.weatherConfig.windGustTypes.none'
        },
        {
          'id': 6,
          'name': 'dialogs.weatherConfig.windGustTypes.some'
        },
        {
          'id': 11,
          'name': 'dialogs.weatherConfig.windGustTypes.more'
        }
      ]
    }

    if (this.applyToScene === undefined) {
      // Settings default region
      mergeObject(additionalData, Utils.getSetting('defaultWeatherSettings'))
      Logger.debug('WeatherConfigDialog:getData(general)', { 'applyToScene': this.applyToScene, 'data': additionalData })
      return additionalData
    } else {
      // Setting for a specific scene
      let sceneData = game.scenes.get(this.applyToScene)?.getFlag(MODULE.ID, 'weatherSettings') ?? undefined
      // if no scene data set, use game setting defaults
      if (!sceneData) sceneData = Utils.getSetting('defaultWeatherSettings')
      mergeObject(additionalData, sceneData)
      Logger.debug('WeatherConfigDialog:getData(scene)', { 'applyToScene': this.applyToScene, 'data': additionalData })
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
    Logger.debug('updateObject, weatherConfig', { 'data': data, 'scene': this.applyToScene })
    if (this.applyToScene === undefined) {
      Utils.setSetting('defaultWeatherSettings', data)
    } else {
      // TODO use Utils for game settings, scene Flags
      game.scenes.get(this.applyToScene).setFlag(MODULE.ID, 'weatherSettings', data)
      // TODO fire event
    }
  }

}

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

import { MODULE, WIND_SPEED, CLOUD_TYPE, PRECI_TYPE, METEO } from '../constants.js'
import { Logger, Utils } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

/**
 * A dialog form for configuring the weather settings.
 */
export class WeatherConfigDialog extends FormApplication {
  /**
   * Reference to the scene these settings shall be applied to. If not set, the settings shall be applied globally
   * @type {Scene|undefined}
   */
  applyToScene = undefined

  /**
   * Creates an instance of WeatherConfigDialog:
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
      template: 'modules/' + MODULE.ID + '/templates/weatherConfig.hbs',
      id: 'weather-settings',
      title: 'dialogs.weatherConfig.title',
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    })
  }

  /* --------------------- Public functions ----------------------- */

  /**
   * Sets up the event listeners for the form.
   * @param {jQuery} jQ - The jQuery object of the form.
   */
  activateListeners(jQ) {
    super.activateListeners(jQ)

    // set initial visibilities
    const directionType = jQ.find('select[name="wind.directionType"]').find(':selected').val()
    if (directionType != 0) {
      jQ.find('#windTypeGrp').addClass('disabled')
    }
    jQ.find('select[name="wind.directionType"]').on('change', function () {
      const directionType = $(this).find(':selected').val()
      if (directionType != 0) {
        jQ.find('#windTypeGrp').addClass('disabled')
      } else {
        jQ.find('#windTypeGrp').removeClass('disabled')
      }
    })

    const cloudsType = jQ.find('select[name="clouds.type"]').find(':selected').val()
    if (cloudsType == 0) {
      jQ.find('#cloudSectionGrp').addClass('disabled')
      jQ.find('#preciGrp').addClass('disabled')
    }
    jQ.find('select[name="clouds.type"]').on('change', function () {
      const cloudsType = $(this).find(':selected').val()
      if (cloudsType == 0) {
        jQ.find('#cloudSectionGrp').addClass('disabled')
        jQ.find('#preciGrp').addClass('disabled')
      } else {
        jQ.find('#cloudSectionGrp').removeClass('disabled')
        jQ.find('#preciGrp').removeClass('disabled')
      }
    })

    const preciType = jQ.find('select[name="precipitation.type"]').find(':selected').val()
    if (preciType == 0) {
      jQ.find('#previAmtGrp').addClass('disabled')
    }
    jQ.find('select[name="precipitation.type"]').on('change', function () {
      const preciType = $(this).find(':selected').val()
      if (preciType == 0) {
        jQ.find('#previAmtGrp').addClass('disabled')
      } else {
        jQ.find('#previAmtGrp').removeClass('disabled')
      }
    })
  }

  /**
   * Retrieves weather configuration data for a given scene or the default region.
   * @returns {Object} An object containing weather configuration data.
   */
  getData() {
    let additionalData = {
      'const': {
        'tmin': METEO.Tmin,
        'tmax': METEO.Tmax
      },      
      windSpeeds: Object.entries(WIND_SPEED).map(([name, id]) => {
        if (name === 'hurricane') {
          return { id: 120, name: 'dialogs.weatherConfig.wind.speeds.hurricane' }
        } else {
          return { id: id, name: 'dialogs.weatherConfig.wind.speeds.' + name }
        }
      }),
      directionTypes: [
        {
          id: 0,
          name: 'dialogs.weatherConfig.directionTypes.fixed'
        },
        {
          id: 1,
          name: 'dialogs.weatherConfig.directionTypes.noise'
        }
      ],
      cloudsTypes: Object.entries(CLOUD_TYPE).map(([name, id]) => {
        return { id: id, name: 'dialogs.weatherConfig.clouds.types.' + name }
      }),
      precipitationTypes: Object.entries(PRECI_TYPE).map(([name, id]) => {
        return { id: id, name: 'dialogs.weatherConfig.precipitation.types.' + name }
      }),
      windGustTypes: [
        {
          id: 0,
          name: 'dialogs.weatherConfig.windGustTypes.none'
        },
        {
          id: 6,
          name: 'dialogs.weatherConfig.windGustTypes.some'
        },
        {
          id: 11,
          name: 'dialogs.weatherConfig.windGustTypes.more'
        }
      ]
    }

    if (this.applyToScene === undefined) {
      // Settings default region
      Utils.mergeObject(additionalData, Fal.getSetting('defaultWeatherSettings'))
      return additionalData
    } else {
      // Setting for a specific scene
      let sceneData = Fal.getSceneFlag('weatherSettings', undefined, this.applyToScene)
      // if no scene data set, use game setting defaults
      if (!sceneData) sceneData = Fal.getSetting('defaultWeatherSettings')
      Utils.mergeObject(additionalData, sceneData)
      Logger.debug('WeatherConfigDialog:getData(scene)', {
        applyToScene: this.applyToScene,
        data: additionalData
      })
      return additionalData
    }
  }

  /* --------------------- Private  functions ----------------------- */

  /**
   * Updates an object with form data.
   * If 'applyToScene' is undefined, updates the default weather settings.
   * Otherwise, updates the weather settings for the specified scene.
   * @param {Event} event - The event triggering the update.
   * @param {FormData} formData - The data to expand and use for the update.
   */
  _updateObject(event, formData) {
    const data = expandObject(formData)
    if (this.applyToScene === undefined) {
      Fal.setSetting('defaultWeatherSettings', data)
    } else {
      Fal.setSceneFlag('weatherSettings', data, this.applyToScene)
    }
  }
}

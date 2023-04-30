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

import { MODULE } from '../constants.js'

/**
 * TODO
 */
export class MacroGenerator {

  /**
   * TODO
   * 
   * @param {*} name 
   * @returns 
   */
  static async buildHeader(name) {
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroHeader.hbs', {
      'headline': name,
      'currentDate': new Date().toLocaleString(),
      'moduleName': MODULE.NAME,
      'moduleId': MODULE.ID,
      'moduleVersion': MODULE.VERSION
    })
    return content
  }

  /**
   * TODO
   * 
   * @param {*} force 
   * @param {*} sceneId 
   * @returns 
   */
  static async buildUpdateConfig(force = false, sceneId = null) {
    let params = {
      'data': {},
      'hasSceneId': false,
      'hasForceParam': false,
      'hasParams': false
    }
    if (sceneId != null) {
      params.data.forSceneId = sceneId
      params.hasSceneId = true
      params.hasParams = true
    }
    if (force) {
      params.data.force = 'true'
      params.hasForceParam = true
      params.hasParams = true
    }
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroUpdateConfig.hbs', params)
    return content
  }

  /**
   * TODO
   * 
   * @param {*} seed 
   * @returns 
   */
  static async buildSetSceneSeed(seed = '') {
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroSeed.hbs', {
      'seed': seed
    })
    return content
  }

  /**
   * TODO
   * 
   * @param {*} param0 
   * @returns 
   */
  static async buildSetSceneTime({ dayCycle = -1, yearCycle = -1 } = {}) {
    if (dayCycle == -1 && yearCycle == -1) return ''
    let data = {}
    if (dayCycle >= 0) {
      data.daylightCycle = Number((dayCycle * 100).toFixed(3))
    }
    if (yearCycle >= 0) {
      data.seasonCycle = Number((yearCycle * 100).toFixed(3))
    }
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroTime.hbs', {
      'data': JSON.stringify(data, null, 2)
    })
    return content
  }

  /**
   * TODO
   * 
   * @param {*} templateId 
   * @param {*} templateName 
   * @returns 
   */
  static async buildSetSceneWeatherTemplate(templateId = '', templateName = '') {
    const moduleId = (templateId.includes('.')) ? templateId.split('.')[0] : null
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroWeatherTemplate.hbs', {
      'moduleCheck': !!(moduleId != null),
      'moduleId': moduleId || '',
      'templateId': templateId,
      'templateName': templateName
    })
    return content
  }

  /**
   * TODO
   * 
   * @param {*} weatherSettings 
   * @returns 
   */
  static async buildSetSceneWeatherSettings(weatherSettings) {
    delete weatherSettings.templateId
    delete weatherSettings.templateName
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroWeather.hbs', {
      'data': JSON.stringify(weatherSettings, null, 2)
    })
    return content
  }

  /**
   * TODO
   * 
   * @param {*} templateId 
   * @param {*} templateName 
   * @returns 
   */
  static async buildSetSceneRegionTemplate(templateId = '', templateName = '') {
    const moduleId = (templateId.includes('.')) ? templateId.split('.')[0] : null
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroRegionTemplate.hbs', {
      'moduleCheck': !!(moduleId != null),
      'moduleId': moduleId || '',
      'templateId': templateId,
      'templateName': templateName
    })
    return content
  }

  /**
   * TODO
   * 
   * @param {*} regionSettings 
   * @returns 
   */
  static async buildSetSceneRegionSettings(regionSettings) {
    delete regionSettings.templateId
    delete regionSettings.templateName
    const content = await renderTemplate('modules/' + MODULE.ID + '/templates/macroRegion.hbs', {
      'data': JSON.stringify(regionSettings, null, 2)
    })
    return content
  }

}

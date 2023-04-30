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
import { MODULE, GENERATOR_MODES, SEASONS } from '../constants.js'
import { TimeProvider } from '../time/timeProvider.js'
import { WeatherPerception } from '../percievers/weatherPerception.js'
import { MacroGenerator } from './macroGenerator.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

/**
 * TODO
 */
export class MacroConfigDialog extends Application {
  static _app = null

  /**
   * TODO
   *
   * @param {*} force
   */
  static refresh(force = false) {
    Logger.trace('MacroConfigDialog.refresh()')
    if (MacroConfigDialog._app) {
      MacroConfigDialog._app.render(force, { height: 'auto' })
    }
  }

  /**
   * TODO
   */
  constructor() {
    super()
    Logger.trace('MacroConfigDialog.ctor')
  }

  /**
   * @override
   */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: 'modules/' + MODULE.ID + '/templates/macroConfig.hbs',
      id: 'scene-weather-macro-config',
      title: 'dialogs.macroConfig.title',
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      resizable: false
    })
  }

  /**
   * Activare listeners. Specifically for the reset permission setting button.
   *
   * @param {jQuery} jQ
   */
  activateListeners(jQ) {
    super.activateListeners(jQ)
    jQ.find("button[type='generate']").on('click', async function () {
      const buttonJQ = $(this)
      const includeTimeOfDay =
        jQ.find('input[name="macro.includeTimeOfDay"]').is(':checked') || false
      const includeDayOfYear =
        jQ.find('input[name="macro.includeDayOfYear"]').is(':checked') || false
      const includeSeed = jQ.find('input[name="macro.includeSeed"]').is(':checked') || false
      const generatorMode = buttonJQ.attr('data-mode') || ''
      Logger.trace('MacroConfigDialog.click(generateFromWeatherTemplate)', {
        generatorMode: generatorMode,
        includeTimeOfDay: includeTimeOfDay,
        includeDayOfYear: includeDayOfYear,
        includeSeed: includeSeed
      })

      let macroConfig = {
        img: 'modules/' + MODULE.ID + '/assets/sw-macro-icon.svg',
        type: 'script',
        scope: 'global'
      }
      const weatherSettings = SceneWeather.getWeatherSettings()
      if (weatherSettings === undefined) return

      let commandIntermediate = ''
      if (includeSeed) {
        commandIntermediate += await MacroGenerator.buildSetSceneSeed(
          weatherSettings.generator.seed
        )
      }
      if (includeTimeOfDay || includeDayOfYear) {
        commandIntermediate += await MacroGenerator.buildSetSceneTime({
          dayCycle: includeTimeOfDay ? TimeProvider.getDaylightCyclePct() : -1,
          yearCycle: includeDayOfYear ? TimeProvider.getSeasonCyclePct() / 2 : -1
        })
      }

      switch (generatorMode) {
        case 'weatherTemplate':
          macroConfig.name =
            Fal.i18n('dialogs.macroConfig.weatherTemplate.title') +
            '(' +
            (weatherSettings.weather?.templateName ?? ' - ') +
            ')'
          macroConfig.command = await MacroGenerator.buildHeader(macroConfig.name)
          macroConfig.command += commandIntermediate
          macroConfig.command += await MacroGenerator.buildSetSceneWeatherTemplate(
          weatherSettings.weather.templateId,
          weatherSettings.weather.templateName
        )
          break
        case 'weather':
          macroConfig.name = Fal.i18n('dialogs.macroConfig.weather.title') + canvas.scene.name + ')'
          macroConfig.command = await MacroGenerator.buildHeader(macroConfig.name)
          macroConfig.command += commandIntermediate
          macroConfig.command += await MacroGenerator.buildSetSceneWeatherSettings(
          weatherSettings.weather
        )
          break
        case 'regionTemplate':
          macroConfig.name =
            Fal.i18n('dialogs.macroConfig.regionTemplate.title') +
            '(' +
            (weatherSettings.region?.templateName ?? ' - ') +
            ')'
          macroConfig.command = await MacroGenerator.buildHeader(macroConfig.name)
          macroConfig.command += commandIntermediate
          macroConfig.command += await MacroGenerator.buildSetSceneRegionTemplate(
          weatherSettings.region.templateId,
          weatherSettings.region.templateName
        )
          break
        case 'region':
          macroConfig.name = Fal.i18n('dialogs.macroConfig.region.title') + canvas.scene.name + ')'
          macroConfig.command = await MacroGenerator.buildHeader(macroConfig.name)
          macroConfig.command += commandIntermediate
          macroConfig.command += await MacroGenerator.buildSetSceneRegionSettings(
          weatherSettings.region
        )
          break
      }
      macroConfig.command += await MacroGenerator.buildUpdateConfig(true)

      // create macro
      const macro = await Macro.create(macroConfig)
      // and display it for editing
      macro.sheet.render(true)
    })
  }

  /**
   * @override
   */
  async _onSubmit(event, options) {
    event.target.querySelectorAll('input[disabled]').forEach((i) => (i.disabled = false))
    return super._onSubmit(event, options)
  }

  /**
   * Returns the form data to render in the handlebars template
   *
   * @returns
   */
  async getData() {
    const seasonPct = TimeProvider.getSeasonCyclePct()
    const [seasonId] = Object.entries(SEASONS).find(([, amount]) => seasonPct <= amount)

    const weatherSettings = SceneWeather.getWeatherSettings()
    if (weatherSettings === undefined) {
      Logger.warn(Fal.i18n('dialogs.macroConfig.disabledWarn'), true)
      return {
        enabled: false
      }
    }

    const data = {
      enabled: true,
      preCheckTime: [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(
        weatherSettings.generator.mode
      ),
      preCheckDate: [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(
        weatherSettings.generator.mode
      ), // TODO
      scene: {
        name: canvas.scene.name,
        id: canvas.scene._id,
        modeName: 'configTab.weatherModes.' + weatherSettings.generator.mode + '.name',
        modeHint: 'configTab.weatherModes.' + weatherSettings.generator.mode + '.hint',
        seed: weatherSettings.generator.seed
      },
      time: {
        summaryString: TimeProvider.getI18nDateString(),
        beforeSummerSolstice: !!(seasonPct <= 1.0),
        pctDistanceSummerSolstice: Math.round(
          (seasonPct > 1.0 ? seasonPct - 1.0 : seasonPct) * 100
        ),
        seasonString: 'time.' + seasonId,
        seasonPct: seasonPct > 1.0 ? seasonPct - 1.0 : seasonPct
      },
      weather: {
        detailHtml: await WeatherPerception.getAsUiHtml(
          'scene-weather.precise',
          SceneWeather.getWeatherModel()
        ),
        hasTemplate: !!(weatherSettings.generator.mode == GENERATOR_MODES.WEATHER_TEMPLATE),
        templateName: weatherSettings.weather?.templateName ?? ''
      },
      region: {
        hasRegion: [GENERATOR_MODES.REGION_TEMPLATE, GENERATOR_MODES.REGION_GENERATE].includes(
          weatherSettings.generator.mode
        ),
        hasTemplate: !!(weatherSettings.generator.mode == GENERATOR_MODES.REGION_TEMPLATE),
        templateName: weatherSettings.region?.templateName ?? ''
      }
    }

    Logger.trace('MacroConfigDialog.getData()', { data: data })
    return data
  }

  /**
   * Update the permission settings based on the formData
   * @param {*} event
   * @param {*} formData
   */
  _updateObject(event, formData) {
    Logger.trace('MacroConfigDialog._updateObject(...)', { formData: formData })
  }
}

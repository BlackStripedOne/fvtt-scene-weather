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

import { Logger, Utils } from './utils.js'
import { MODULE } from './constants.js'
import { TimeProvider } from './time/timeProvider.js'
import { SceneWeatherState } from './state.js'
import { Noise } from './noise.js'
import { Meteo } from './meteo.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'

/**
 *  WeatherModel produces SceneWeather (which also can be set via Weather Template option)
 */
export class WeatherModel {

  /* --------------------- Properties ----------------------- */

  useConfigSceneId = undefined

  regionMeteo = undefined

  weatherData = undefined

  _cache = {}

  /**
     * TODO
     * @param {*} param0
     */
  constructor({ regionMeteo, templateId, useWeatherConfig }) {
    Logger.debug('WeatherModel:constrctor', {
      regionMeteo: regionMeteo,
      templateId: templateId,
      useWeatherConfig: useWeatherConfig
    })
    this._cache = {}
    if (regionMeteo !== undefined) {
      // weatherMode -> GENERATOR_MODES.REGION_*
      this.regionMeteo = regionMeteo
      this.useConfigSceneId = undefined
      this.updateConfig()
    } else if (useWeatherConfig !== undefined) {
      // weatherMode -> GENERATOR_MODES.WEATHER_GENERATE
      this.regionMeteo = undefined
      this.useConfigSceneId = useWeatherConfig
      this.updateConfig()
    } else {
      // weatherMode -> GENERATOR_MODES.WEATHER_TEMPLATE
      this.regionMeteo = undefined
      this.useConfigSceneId = undefined
      this.weatherData = Utils.deepClone(SceneWeatherState._weatherTemplates[templateId])
      if (this.weatherData === undefined) {
        this.weatherData = Utils.deepClone(Object.values(SceneWeatherState._weatherTemplates)[0])
        canvas.scene.setFlag(MODULE.ID, 'weatherTemplate', this.weatherData.id) // TODO use FAL
        const [tId, mId] = templateId.split('.')
        Logger.error(
          'Unable to set weather template with id [' +
          tId +
          '], registered by module [' +
          mId +
          ']. Reverting to [' +
          Fal.i18n(this.weatherData.name) +
          ']. Maybe you removed a SceneWeather plugin after configuring your scene.',
          true
        )
      }
      this.weatherData.precipitation.mode = Fal.getSceneFlag('rainMode', 'winddir')
      this.weatherData.source = '_TEMPLATE_'
    }
  }

  /* --------------------- Static ----------------------- */

  static DEFAULT_MODEL_STRUCT = {
    source: '_DISABLED_',
    name: 'disabled',
    temp: {
      underground: 14.5, // average temperature at -20m below surface as default
      ground: 0,
      air: 0,
      percieved: 0
    },
    wind: {
      speed: 0,
      gusts: 0,
      direction: 0
    },
    clouds: {
      coverage: 0,
      bottom: 0,
      top: 0,
      type: 0
    },
    precipitation: {
      amount: 0,
      type: 0
    },
    sun: {
      amount: 0
    },
    humidity: 0
  }

  /**
   * TODO
   * @returns - array of dictionaries containing 'id' and 'name'
   */
  static getTemplates() {
    Logger.debug('getTemplates', { t: Object.entries(SceneWeatherState._weatherTemplates) })
    return Object.entries(SceneWeatherState._weatherTemplates).map((template) => {
      return {
        id: template[0],
        name: template[1].name
      }
    })
  }

  static fromSceneConfig(sceneId) {
    return new WeatherModel({ useWeatherConfig: sceneId })
  }

  /**
   * TODO Builder pattern
   * @param {*} id
   * @returns
   */
  static fromTemplate(id) {
    return new WeatherModel({ templateId: id })
  }

  /**
   * TODO Builder pattern
   * @param {*} regionMeteo
   * @returns
   */
  static fromRegion(regionMeteo) {
    return new WeatherModel({ regionMeteo: regionMeteo })
  }

  /* --------------------- Functions, public ----------------------- */

  /**
   * TODO
   */
  updateConfig() {
    // update on potentially changed settings on the scene or default values
    // TODO

    if (this.regionMeteo !== undefined) {
      // weatherMode -> GENERATOR_MODES.REGION_*
      Logger.debug('WeatherModel.updateConfig() -> invalidating cache, invoking on regionMeteo...')
      // invalidate cache
      this._cache = {}
      // update with new settings
      return this.regionMeteo.updateConfig()
    }
    if (this.useConfigSceneId !== undefined) {
      // weatherMode -> GENERATOR_MODES.WEATHER_GENERATE
      Logger.debug('WeatherModel.updateConfig() -> getting weatherConfig from Scene.', {
        configSceneId: this.useConfigSceneId
      })
      // update weather from sceneConfig by sceneId of global

      let sourceId = this.useConfigSceneId
      let weatherConfig = Fal.getSceneFlag('weatherSettings', undefined, this.useConfigSceneId)
      Logger.debug('WeatherModel.updateConfig() -> load from scene flags', {
        weatherConfig: weatherConfig,
        sceneId: this.useConfigSceneId
      })

      // if no scene data set, use game setting defaults
      if (!weatherConfig) {
        weatherConfig = Fal.getSetting('defaultWeatherSettings')
        sourceId = '_GLOBAL_'
        Logger.debug('WeatherModel.updateConfig() -> no weather on flags, using global', {
          weatherConfig: weatherConfig
        })
      }

      // initiate noise
      const seedString = Fal.getSceneFlag('seed', '')
      const seedValue = Utils.getSeedFromString(seedString)
      Logger.debug('WeatherModel:updateConfig(seed)', {
        seedString: seedString,
        seedValue: seedValue
      })
      this._noise = Noise.createNoise2D(seedValue)

      const windGusts = weatherConfig.wind.speed + weatherConfig.wind.gusts
      const windDirection = Math.trunc(
        weatherConfig.wind.directionType == 1
          ? this._getNoisedWindDirection(
            TimeProvider.getCurrentTimeHash(),
            windGusts
          )
          : weatherConfig.wind.direction
      )

      let newWeatherData = Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), {
        source: sourceId,
        name: 'custom',
        temp: {
          ground: weatherConfig.temp.ground,
          air: weatherConfig.temp.air,
          percieved: Math.round(
            Meteo.apparentTemperature(
              weatherConfig.temp.air,
              weatherConfig.wind.speed,
              weatherConfig.humidity
            )
          )
        },
        wind: {
          speed: weatherConfig.wind.speed,
          gusts: windGusts,
          direction: windDirection,
          directionType: weatherConfig.wind.directionType
        },
        clouds: {
          coverage: weatherConfig.clouds.coverage / 100, // we use fractions here
          bottom: weatherConfig.clouds.bottom,
          top: weatherConfig.clouds.bottom + weatherConfig.clouds.thickness,
          type: weatherConfig.clouds.type
        },
        precipitation: {
          amount: weatherConfig.precipitation.amount / 100, // we use fractions here
          type: weatherConfig.precipitation.type,
          mode: Fal.getSceneFlag('rainMode', 'winddir', this.useConfigSceneId) || 0
        },
        sun: {
          amount: weatherConfig.sun.amount / 100 // we use fractions here,
        },
        humidity: weatherConfig.humidity
      })
      Logger.debug('WeatherModel.merged', {
        newWeatherData: newWeatherData,
        weatherData: this.weatherData
      })

      if (Utils.objectsEqual(this.weatherData, newWeatherData)) {
        Logger.debug('WeatherModel.updateConfig() -> static from sceneConfig, no changes.')
        return false
      } else {
        this.weatherData = newWeatherData
        Logger.debug('WeatherModel.updateConfig() -> static from sceneConfig', {
          sceneId: this.useConfigSceneId,
          weatherData: this.weatherData
        })
        return true
      }
    } else {
      // weatherMode -> GENERATOR_MODES.WEATHER_TEMPLATE
      if (this.weatherData.precipitation.mode == Fal.getSceneFlag('rainMode', 'winddir')) {
        Logger.debug('WeatherModel.updateConfig() -> static, nothing to do.')
        return false
      } else {
        this.weatherData.precipitation.mode = Fal.getSceneFlag('rainMode', 'winddir')
        return true
      }
    }
  }

  /**
   * TODO
   *
   * @param {*} dayOffset
   * @param {*} hourOffset
   * @returns
   */
  getWeatherData(dayOffset = 0, hourOffset = 0) {
    if (this.regionMeteo !== undefined) {
      // weatherMode -> GENERATOR_MODES.REGION_*
      const regionBaseValues = this.regionMeteo.getRegionBase(dayOffset, hourOffset)

      // implement caching for already calculated regionBaseValues.timeHash
      if (this._cache[regionBaseValues.timeHash] !== undefined) {
        this.weatherData = this._cache[regionBaseValues.timeHash]
        return this._cache[regionBaseValues.timeHash]
      }

      this.weatherData = Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), {
        source: '_REGION_',
        name: regionBaseValues.name,
        temp: {
          ground: this._groundTemp(3, 3, dayOffset, hourOffset),
          air: regionBaseValues.baseTemp, // will be adjusted based on wind.speed, sun.amount and temp.ground
          percieved: 0  // deferred calculation, dependant on temp.air, wind.speed and humidity
        },
        wind: {
          speed: regionBaseValues.wind, // will be adjusted based on precipitation.amount
          gusts: regionBaseValues.gusts + regionBaseValues.wind,  // will be adjusted based on precipitation.amount
          direction: 0 // direct calculation, dependant on wind.gusts
        },
        clouds: {
          coverage: 0,  // deferred calculation, dependant on clouds.top and clouds.bottom
          bottom: Utils.clamp(
            Math.abs(
              Meteo.liftedCondensationLevel(
                regionBaseValues.baseTemp,
                regionBaseValues.baseHumidity
              )
            ),
            0,
            20000
          ), // LCL in altitude meters above sea level on ICAO standard atmosphere up to 20km
          top: 0,
          type: 0 // 0: none, 1:groundfog, 2:stratus, 3:cumulus, 4:cumulunimbus
        },
        precipitation: {
          amount: 0,
          type: 0, // 0: none, 1:drizzle, 2:rain, 3:downpour, 4:hail, 5:snow, 6:blizzard
          mode: Fal.getSceneFlag('rainMode', 'winddir') // default to mode:winddir
        },
        sun: {
          amount: regionBaseValues.sunAmount
        },
        humidity: regionBaseValues.baseHumidity
      })

      // Determin cloud hight
      // temperature coefficient at cloud bottom altitude
      const tempCoefficient = Meteo.calcAdiCloudBottomCoeff(this.weatherData.clouds.bottom, regionBaseValues.elevation, regionBaseValues.baseTemp)

      // geopotential based on evaporation and hydration
      this.weatherData.clouds.top = Meteo.calcCloudTops(tempCoefficient, this.weatherData.clouds.bottom, regionBaseValues.vegetation, regionBaseValues.sunAmount, regionBaseValues.wind, regionBaseValues.waterAmount)

      // calculate coverage based on layer thickness and cloud type
      this.weatherData.clouds.coverage = Meteo.calcCloudCoverate(this.weatherData.clouds.bottom, this.weatherData.clouds.top)

      this.weatherData.clouds.type = Meteo.getCloudType(regionBaseValues.elevation, this.weatherData.clouds.bottom, this.weatherData.clouds.top, this.weatherData.clouds.coverage, tempCoefficient)

      // Calculate precipitation amount
      this.weatherData.precipitation.amount =
        Utils.clamp(this.weatherData.clouds.coverage * 1.2 - 0.4, 0, 1) *
        Noise.getNoisedValue(
          this.regionMeteo._noise,
          regionBaseValues.timeHash + 321,
          8,
          0.8,
          0.2
        ) *
        Noise.getNoisedValue(this.regionMeteo._noise, regionBaseValues.timeHash + 321, 32, 1, 0.5)

      // Recalculate gusts depending on rain amount
      this.weatherData.wind.gusts =
        this.weatherData.wind.gusts * (this.weatherData.precipitation.amount * 2.5 + 0.5)

      // Recalculate wind speed depending on rain amount
      this.weatherData.wind.speed =
        this.weatherData.wind.speed +
        this.weatherData.precipitation.amount * 2.2 * this.weatherData.wind.speed

      // Recalculate sun amount based on cloud coverage
      this.weatherData.sun.amount =
        this.weatherData.sun.amount * Utils.clamp(1 - this.weatherData.clouds.coverage, 0.2, 1.0)

      // Recalculate ground temperature based on sun, rain and wind
      this.weatherData.temp.air =
        this.weatherData.temp.air -
        this.weatherData.wind.speed * 0.03 +
        this.weatherData.sun.amount * Math.max(2, this.weatherData.temp.ground * 0.6)
      this.weatherData.temp.percieved = Meteo.apparentTemperature(
        this.weatherData.temp.air,
        this.weatherData.wind.speed,
        this.weatherData.humidity
      )

      // set cloud altitudes to hight in meters based on the scene's elevation
      this.weatherData.clouds.top =
        Math.max(0, this.weatherData.clouds.top - regionBaseValues.elevation) * 3
      this.weatherData.clouds.bottom =
        Math.max(0, this.weatherData.clouds.bottom - regionBaseValues.elevation) * 3

      // Calculate ptecipitation type
      this.weatherData.precipitation.type = Meteo.getPrecipitationType(this.weatherData.precipitation.amount, this.weatherData.clouds.type, this.weatherData.temp.air, this.weatherData.wind.speed)

      // Calculate wind direction just for fancyness
      this.weatherData.wind.direction = this._getNoisedWindDirection(
        regionBaseValues.timeHash,
        this.weatherData.wind.gusts,
        this.regionMeteo._noise
      )

      // Store in cache
      this._cache[regionBaseValues.timeHash] = this.weatherData
      return this.weatherData
    } else if (this.useConfigSceneId !== undefined) {
      // weatherMode -> GENERATOR_MODES.WEATHER_GENERATE
      // Just update the wind direction
      if (this.weatherData.wind.directionType == 1) {
        // TODO use constant for winddirection
        this.weatherData.wind.direction = this._getNoisedWindDirection(
          TimeProvider.getCurrentTimeHash(dayOffset, hourOffset),
          this.weatherData.wind.gusts
        )
      }
      return this.weatherData
    } else {
      return this.weatherData
    }
  }

  /**
     * TODO
     */
  _getNoisedWindDirection(timeHash, gusts, noiseFunction = this._noise) {
    let windDirection =
      Noise.getNoisedValue(noiseFunction, timeHash + 1277, 512, 180, 180) +
      Noise.getNoisedValue(noiseFunction, timeHash + 1277, 8, 16, 16) * (gusts * 0.2)
    if (windDirection < 0) windDirection += 360
    if (windDirection >= 360) windDirection -= 360
    return windDirection
  }

  /**
   * TODO
   *
   * @param {*} steps
   * @param {*} stepWidth
   * @param {*} dayOffset
   * @param {*} hourOffset
   * @returns
   *
   * @private
   */
  _groundTemp(steps, stepWidth, dayOffset = 0, hourOffset = 0) {
    let total = 0
    let count = 0

    for (let n = 0; n <= steps; n++) {
      // Calculate the value of X(A-n) with logarithmically decreasing weight
      let weight = 1 / Math.log2(n + 2)
      total +=
        this.regionMeteo.getRegionBase(dayOffset, hourOffset - n * stepWidth).baseTemp * weight
      count += weight
    }

    // Divide the total by the count to get the average
    return total / count
  }


}

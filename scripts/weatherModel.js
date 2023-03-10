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
import { METEO, MODULE } from './constants.js'
import { TimeProvider } from './timeProvider.js'
import { SceneWeatherState } from './state.js'
import { Noise } from './noise.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'


/**
 *  WeatherModel produces SceneWeather (which also can be set via Weather Template option)
 */
export class WeatherModel {

  static DEFAULT_MODEL_STRUCT = {
    "source": "_DISABLED_",
    "name": "disabled",
    "temp": {
      "ground": 0,
      "air": 0,
      "percieved": 0
    },
    "wind": {
      "speed": 0,
      "gusts": 0,
      "direction": 0
    },
    "clouds": {
      "coverage": 0,
      "bottom": 0,
      "top": 0,
      "type": 0
    },
    "precipitation": {
      "amount": 0,
      "type": 0
    },
    "sun": {
      "amount": 0
    },
    "humidity": 0
  }

  /**
   * TODO
   * @param {*} param0 
   */
  constructor({ regionMeteo, templateId, useWeatherConfig }) {
    Logger.debug('WeatherModel:constrctor', { 'regionMeteo': regionMeteo, 'templateId': templateId, 'useWeatherConfig': useWeatherConfig })
    this._cache = {}
    if (regionMeteo !== undefined) {
      this.regionMeteo = regionMeteo
      this.useConfigSceneId = undefined
      this.updateConfig()
    } else if (useWeatherConfig !== undefined) {
      this.regionMeteo = undefined
      this.useConfigSceneId = useWeatherConfig
      this.updateConfig()
    } else {
      this.regionMeteo = undefined
      this.useConfigSceneId = undefined
      this.weatherData = SceneWeatherState._weatherTemplates[templateId]
      if (this.weatherData === undefined) {
        this.weatherData = Object.values(SceneWeatherState._weatherTemplates)[0]
        canvas.scene.setFlag(MODULE.ID, 'weatherTemplate', this.weatherData.id)
        const [tId, mId] = templateId.split('.')
        Logger.error('Unable to set weather template with id [' + tId + '], registered by module [' + mId + ']. Reverting to [' + Fal.i18n(this.weatherData.name) + ']. Maybe you removed a SceneWeather plugin after configuring your scene.', true)
      }
      this.weatherData.precipitation.mode = Fal.getSceneFlag('rainMode', 'winddir')
    }
  }

  /**
   * TODO
   * @returns - array of dictionaries containing 'id' and 'name'
   */
  static getTemplates() {
    Logger.debug('getTemplates', { 't': Object.entries(SceneWeatherState._weatherTemplates) })
    return Object.entries(SceneWeatherState._weatherTemplates).map(template => {
      return {
        'id': template[0],
        'name': template[1].name
      }
    })
  }

  static fromSceneConfig(sceneId) {
    return new WeatherModel({ 'useWeatherConfig': sceneId })
  }

  /**
   * TODO Builder pattern
   * @param {*} id 
   * @returns 
   */
  static fromTemplate(id) {
    return new WeatherModel({ 'templateId': id })
  }

  /**
   * TODO Builder pattern
   * @param {*} regionMeteo 
   * @returns 
   */
  static fromRegion(regionMeteo) {
    return new WeatherModel({ 'regionMeteo': regionMeteo })
  }

  /**
   * TODO
   */
  updateConfig() {
    // update on potentially changed settings on the scene or default values
    // TODO    
    if (this.regionMeteo !== undefined) {
      Logger.debug('WeatherModel.updateConfig() -> invalidating cache, invoking on regionMeteo...')
      // invalidate cache
      this._cache = {}
      // update with new settings
      return this.regionMeteo.updateConfig()
    } if (this.useConfigSceneId !== undefined) {
      Logger.debug('WeatherModel.updateConfig() -> getting weatherConfig from Scene.', { 'configSceneId': this.useConfigSceneId })
      // update weather from sceneConfig by sceneId of global

      let sourceId = this.useConfigSceneId
      let weatherConfig = Fal.getSceneFlag('weatherSettings', undefined, this.useConfigSceneId)
      Logger.debug('WeatherModel.updateConfig() -> load from scene flags', { 'weatherConfig': weatherConfig, 'sceneId': this.useConfigSceneId })

      // if no scene data set, use game setting defaults
      if (!weatherConfig) {
        weatherConfig = Fal.getSetting('defaultWeatherSettings')
        sourceId = '_GLOBAL_'
        Logger.debug('WeatherModel.updateConfig() -> no weather on flags, using global', { 'weatherConfig': weatherConfig })
      }

      // initiate noise
      this._noise = Noise.createNoise2D(0) // TODO use configurable seed

      const windGusts = weatherConfig.wind.speed + weatherConfig.wind.gusts
      const windDirection = Math.trunc(weatherConfig.wind.directionType == 1 ? WeatherModel._getNoisedWindDirection(this._noise, TimeProvider.getCurrentTimeHash(), windGusts) : weatherConfig.wind.direction)

      let newWeatherData = Utils.mergeObject(Utils.deepClone(WeatherModel.DEFAULT_MODEL_STRUCT), {
        'source': sourceId,
        'name': 'custom',
        'temp': {
          'ground': weatherConfig.temp.ground,
          'air': weatherConfig.temp.air,
          'percieved': Math.trunc(WeatherModel._apparentTemperature(weatherConfig.temp.air, weatherConfig.wind.speed, weatherConfig.humidity, METEO.isaSeaLevelPa / 100))
        },
        'wind': {
          'speed': weatherConfig.wind.speed,
          'gusts': windGusts,
          'direction': windDirection,
          'directionType': weatherConfig.wind.directionType
        },
        'clouds': {
          'coverage': weatherConfig.clouds.coverage / 100,  // we use fractions here
          'bottom': weatherConfig.clouds.bottom,
          'top': weatherConfig.clouds.bottom + weatherConfig.clouds.thickness,
          'type': weatherConfig.clouds.type
        },
        'precipitation': {
          'amount': weatherConfig.precipitation.amount / 100,  // we use fractions here
          'type': weatherConfig.precipitation.type,
          'mode': Fal.getSceneFlag('rainMode', 'winddir', this.useConfigSceneId) || 0
        },
        'sun': {
          'amount': weatherConfig.sun.amount / 100  // we use fractions here,
        },
        'humidity': weatherConfig.humidity
      })
      Logger.debug('WeatherModel.merged', { 'newWeatherData': newWeatherData, 'weatherData': this.weatherData })

      if (Utils.objectsEqual(this.weatherData, newWeatherData)) {
        Logger.debug('WeatherModel.updateConfig() -> static from sceneConfig, no changes.')
        return false
      } else {
        this.weatherData = newWeatherData
        Logger.debug('WeatherModel.updateConfig() -> static from sceneConfig', { 'sceneId': this.useConfigSceneId, 'weatherData': this.weatherData })
        return true
      }
    } else {
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
      let regionBaseValues = this.regionMeteo.getRegionBase(dayOffset, hourOffset)

      // implement caching for already calculated regionBaseValues.timeHash
      if (this._cache[regionBaseValues.timeHash] !== undefined) {
        this.weatherData = this._cache[regionBaseValues.timeHash]
        return this._cache[regionBaseValues.timeHash]
      }

      this.weatherData = Utils.mergeObject(WeatherModel.DEFAULT_MODEL_STRUCT, {
        'name': regionBaseValues.name,
        'temp': {
          'ground': this._groundTemp(3, 3, dayOffset, hourOffset),
          'air': regionBaseValues.baseTemp,
          'percieved': 0
        },
        'wind': {
          'speed': regionBaseValues.wind,
          'gusts': regionBaseValues.gusts + regionBaseValues.wind,
          'direction': 0
        },
        'clouds': {
          'coverage': 0,
          'bottom': Utils.clamp(Math.abs(WeatherModel._liftedCondensationLevel(regionBaseValues.baseTemp, regionBaseValues.baseHumidity)), 0, 20000),  // LCL in altitude meters above sea level on ICAO standard atmosphere up to 20km
          'top': 0,
          'type': 0 // 0: none, 1:groundfog, 2:stratus, 3:cumulus, 4:cumulunimbus
        },
        'precipitation': {
          'amount': 0,
          'type': 0, // 0: none, 1:drizzle, 2:rain, 3:downpour, 4:hail, 5:snow, 6:blizzard
          'mode': Fal.getSceneFlag('rainMode', 'winddir') // default to mode:winddir
        },
        'sun': {
          'amount': regionBaseValues.sunAmount,
        },
        'humidity': regionBaseValues.baseHumidity
      })

      // Determin cloud hight
      // temperature coefficient at cloud bottom altitude
      let tempCoifficient = WeatherModel._calcAdiCloudBottomCoeff(this.weatherData, regionBaseValues)
      // geopotential based on evaporation and hydration
      let geopotential = WeatherModel._calcGeopotential(regionBaseValues)
      if (tempCoifficient < 0) {
        this.weatherData.clouds.top = this.weatherData.clouds.bottom + (geopotential * 12.6) // cumulu forming
      } else {
        this.weatherData.clouds.top = this.weatherData.clouds.bottom + (geopotential * 0.27)   // cirrus forming
      }

      // calculate coverage based on layer thickness and cloud type
      this.weatherData.clouds.coverage = Utils.clamp((this.weatherData.clouds.top - this.weatherData.clouds.bottom) / 100, 0, 1)

      if (this.weatherData.clouds.bottom < regionBaseValues.elevation) {
        // In clouds
        this.weatherData.clouds.type = 1 // Fog
      } else {
        // below clouds
        if (tempCoifficient < 0) {
          if ((this.weatherData.clouds.top - this.weatherData.clouds.bottom) > 1000) {
            this.weatherData.clouds.type = 3 // Cumulus
          }
          if ((this.weatherData.clouds.top - this.weatherData.clouds.bottom) > 3000) {
            this.weatherData.clouds.type = 4 // Cumulu Numbus Extremis
          }
        }
        if (this.weatherData.clouds.type < 3) {
          if (this.weatherData.clouds.coverage > 0.3) {
            this.weatherData.clouds.type = 2 // Stratus
          }
        }
      }

      // Calculate precipitation amount
      this.weatherData.precipitation.amount = Utils.clamp(this.weatherData.clouds.coverage * 1.2 - 0.4, 0, 1)
        * Noise.getNoisedValue(this.regionMeteo._noise, regionBaseValues.timeHash + 321, 8, 0.8, 0.2)
        * Noise.getNoisedValue(this.regionMeteo._noise, regionBaseValues.timeHash + 321, 32, 1, 0.5)

      // Recalculate gusts depending on rain amount
      this.weatherData.wind.gusts = this.weatherData.wind.gusts * (this.weatherData.precipitation.amount * 2.5 + 0.5)

      // Recalculate wind speed depending on rain amount
      this.weatherData.wind.speed = this.weatherData.wind.speed + (this.weatherData.precipitation.amount * 2.2) * this.weatherData.wind.speed

      // Recalculate sun amount based on cloud coverage
      this.weatherData.sun.amount = this.weatherData.sun.amount * Utils.clamp((1 - this.weatherData.clouds.coverage), 0.2, 1.0)

      // Recalculate ground temperature based on sun, rain and wind
      this.weatherData.temp.air = this.weatherData.temp.air - (this.weatherData.wind.speed * 0.03) + (this.weatherData.sun.amount * Math.max(2, this.weatherData.temp.ground * 0.6))
      this.weatherData.temp.percieved = WeatherModel._apparentTemperature(this.weatherData.temp.air, this.weatherData.wind.speed, this.weatherData.humidity, WeatherModel._heightToPressure(regionBaseValues.elevation))

      // set cloud altitudes to hight in meters based on the scene's elevation
      this.weatherData.clouds.top = Math.max(0, this.weatherData.clouds.top - regionBaseValues.elevation) * 3
      this.weatherData.clouds.bottom = Math.max(0, this.weatherData.clouds.bottom - regionBaseValues.elevation) * 3

      // Calculate ptecipitation type
      this.weatherData.precipitation.type = WeatherModel._calcPrecipitationType(this.weatherData)

      // Calculate wind direction just for fancyness
      this.weatherData.wind.direction = WeatherModel._getNoisedWindDirection(this.regionMeteo._noise, regionBaseValues.timeHash, this.weatherData.wind.gusts)

      // Store in cache
      this._cache[regionBaseValues.timeHash] = this.weatherData
      return this.weatherData
    } else if (this.useConfigSceneId !== undefined) {
      // Just update the wind direction
      Logger.debug('Updating wind direction for weatherConfig based weatherData...', { 'this.weatherData': this.weatherData })
      if (this.weatherData.wind.directionType == 1) {
        this.weatherData.wind.direction = WeatherModel._getNoisedWindDirection(this._noise, TimeProvider.getCurrentTimeHash(dayOffset, hourOffset), this.weatherData.wind.gusts)
      }
      return this.weatherData
    } else {
      return this.weatherData
    }
  }

  /**
   * TODO
   */
  static _getNoisedWindDirection(noiseFunction, timeHash, gusts) {
    let windDirection = Noise.getNoisedValue(noiseFunction, timeHash + 1277, 512, 180, 180) + (Noise.getNoisedValue(noiseFunction, timeHash + 1277, 8, 16, 16) * (gusts * 0.2))
    if (windDirection < 0) windDirection += 360
    if (windDirection >= 360) windDirection -= 360
    return windDirection
  }

  /**
     * TODO 
     * 
     * @param {*} baseValues 
     * @returns 
     */
  static _calcGeopotential(baseValues) {
    return (baseValues.vegetation * (baseValues.sunAmount * 1.3 + baseValues.wind * 0.7)) +  // vegetation based evaporation
      (baseValues.sunAmount * 0.3 + baseValues.waterAmount * (baseValues.wind * 1.3))   // water body based evaporation
  }

  /**
   * TODO input altitude in meter AMSL, output pressure in hPa
   * @see https://en.wikipedia.org/wiki/Barometric_formula
   * 
   * @param {*} altitude 
   * @returns 
   * 
   * @private
   */
  static _heightToPressure(altitude) {
    if (altitude < 11000) {
      return (METEO.isaSeaLevelPa * Math.pow(METEO.isaMSLtempC / (METEO.isaMSLtempC + (METEO.adiabaticHyDryCoeff * altitude)), (METEO.g * METEO.mAir) / (METEO.R * METEO.adiabaticHyDryCoeff))) / 100
    } else if (altitude <= 20000) {
      // Calculate plateu at 11km
      var plateuPres = METEO.isaSeaLevelPa * Math.pow(METEO.isaMSLtempC / (altitude + (METEO.adiabaticHyDryCoeff * 11000)), (METEO.g * METEO.mAir) / (METEO.R * METEO.adiabaticHyDryCoeff))
      // Coefficient for dry adiabatic above mesosphere
      var mesoSpCoeff = METEO.isaMSLtempC + (11000 * (METEO.adiabaticHyDryCoeff))
      return (plateuPres * Math.exp(((-METEO.g) * METEO.mAir * (altitude - 11000)) / (METEO.R * mesoSpCoeff))) / 100
    } else {
      // Assume no pressure beyond this point
      return 0
    }
  }

  /**
   * Get apparent temperature. Use wind chill or heat index.
   * 
   * @param {number} temperature - temperature in celsius
   * @param {number} windSpeed - wind speed in km/h
   * @param {number} humidity - relative humidity
   * @param {number} pressure - pressure in hPa   
   * @returns {number} the apparent temperature in degrees celsius
   * 
   * @private
   */
  static _apparentTemperature(temperature, windSpeed, humidity, pressure) {
    if (temperature < 10) {
      return WeatherModel._windChill(temperature, windSpeed)
    } else {
      return WeatherModel._heatIndex(temperature, humidity, pressure)
    }
  }

  /**
   * Wind chill calculation.
   * @see https://en.wikipedia.org/wiki/Wind_chill
   * 
   * @param {number} temperature - temperature in celsius
   * @param {number} windSpeed - wind speed in km/h
   * @returns {number} the amount of wind chill in degrees celsius
   * 
   * @private
   */
  static _windChill(temperature, windSpeed) {
    if (temperature >= 10) return Tc
    let Rc
    if (windSpeed >= 4.8 && windSpeed <= 177) {
      // stronger wind cooling with more precise polynomial approximation
      Rc = 13.12 + 0.6215 * temperature + (0.3965 * temperature - 11.37) * Math.pow(windSpeed, 0.16)
    } else if (windSpeed < 4.8) {
      // less wind cooling with faster polynomial approximation
      Rc = temperature + 0.2 * (0.1345 * temperature - 1.59) * windSpeed
    } else {
      Rc = temperature
    }
    return Rc
  }

  /**
   * Heat index calculation.
   * @see https://en.wikipedia.org/wiki/Heat_index
   *
   * @param {number} temperature - temperature in celsius
   * @param {number} humidity - relative humidity
   * @param {number} pressure - pressure in hPa 
   * @returns {number}
   * 
   * @private
   */
  static _heatIndex(temperature, humidity, pressure) {
    if (pressure < 16) return temperature
    if (temperature < 27 || METEO.R < 0.40 || WeatherModel._dewPoint(temperature, humidity) < 12) return temperature

    const c1 = -8.784695
    const c2 = 1.61139411
    const c3 = 2.338549
    const c4 = -0.14611605
    const c5 = -1.2308094 * 0.01
    const c6 = -1.6424828 * 0.01
    const c7 = 2.211732 * 0.001
    const c8 = 7.2546 * 0.0001
    const c9 = -3.582 * 0.000001

    return c1 + c2 * temperature +
      c3 * humidity +
      c4 * temperature * humidity +
      c5 * temperature * temperature +
      c6 * humidity * humidity +
      c7 * temperature * temperature * humidity +
      c8 * temperature * humidity * humidity +
      c9 * temperature * temperature * humidity * humidity
  }

  /**
   * Dew point calculation.
   * @see https://en.wikipedia.org/wiki/Dew_point
   *
   * @param {number} temperature - temperature in celsius [0,60]
   * @param {number} humidity - relative humidity [0,100]
   * @returns {number}
   * 
   * @private
  */
  static _dewPoint(temperature, humidity) {
    humidity = humidity / 100
    if (temperature < 0 || temperature > 60) return temperature
    if (humidity < 0.01 || humidity > 1) return temperature
    const a = 17.27 // 1974 Psychrometry and Psychrometric Charts
    let alphaTR = ((a * temperature) / (METEO.Tzero + temperature)) + Math.log(humidity)
    let relativeTemperature = (METEO.Tzero * alphaTR) / (a - alphaTR)
    if (relativeTemperature < 0 || relativeTemperature > 50) return temperature
    return relativeTemperature
  }

  /**
   * Determin wether we have positive cooling coefficient or negative one based on geopotential and temperature gradient
   * 
   * @param {*} weatherData 
   * @param {*} baseValues 
   * @returns 
   */
  static _calcAdiCloudBottomCoeff(weatherData, baseValues) {
    let isaTempAtBase = METEO.isaMSLtempC + ((weatherData.clouds.bottom - baseValues.elevation) * METEO.adiabaticHyDryCoeff)
    let tempAtBase = baseValues.baseTemp + ((weatherData.clouds.bottom - baseValues.elevation) * METEO.adiabaticHyDryCoeff)
    return isaTempAtBase - tempAtBase // negatie means rising -> cumulus clouds
  }

  /**
   * TODO 
   * 
   * @param {*} weatherData 
   * @returns 
   */
  static _calcPrecipitationType(weatherData) {
    if (weatherData.precipitation.amount < 0.10) {
      // less then 10% amount, we assume it is not raining at all
      return 0 // none
    } else {
      if (weatherData.clouds.type > 3 && weatherData.precipitation.amount > 0.70) {
        // CB(4+)
        if (weatherData.temp.air < 4) {
          return 6 // blizzard
        } else {
          if (weatherData.wind.speed > 0.20) {
            return 4 // hail
          } else {
            return 3 // downpour
          }
        }
      } else if (weatherData.clouds.type >= 3) {
        // CU(3)
        if (weatherData.temp.air < 4) {
          if (weatherData.wind.speed > 0.20) {
            return 6 // blizzard
          } else {
            return 5 // snow  
          }
        } else {
          return 2 // rain  
        }
      } else if (weatherData.clouds.type == 2) {
        // ST(2)
        if (weatherData.temp.air < 4) {
          return 5 // snow  
        } else {
          return 1 // drizzle
        }
      } else {
        // FG(1) or NONE(0)
        if (weatherData.precipitation.amount > 0.70) {
          if (weatherData.temp.air < 4) {
            return 5 // snow
          } else {
            return 1 // drizzle
          }
        } else {
          return 0 // none
        }
      }
    }
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
      total += this.regionMeteo.getRegionBase(dayOffset, hourOffset - (n * stepWidth)).baseTemp * weight
      count += weight
    }

    // Divide the total by the count to get the average
    return total / count
  }

  /**
   * Calculate the lifted condensation level
   * 
   * @param {*} temperature 
   * @param {*} humidity 
   * @returns 
   * 
   * @private
   */
  static _liftedCondensationLevel(temperature, humidity) {
    let Td = temperature - ((100 - humidity) / 5)
    return 125 * (temperature - Td)
  }

}

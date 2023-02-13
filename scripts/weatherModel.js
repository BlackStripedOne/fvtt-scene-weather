import { Logger, Utils } from './utils.js'
import { METEO } from './constants.js'

/**
 *  WeatherModel produces SceneWeather (which also can be set via Weather Template option)
 */
export class WeatherModel {

  static templates = {
    'default': {
      'name': 'Default',
      'temp': {
        'ground': 14,
        'air': 18,
        'percieved': 18
      },
      'wind': {
        'speed': 0,
        'gusts': 0,
        'direction': 0
      },
      'clouds': {
        'coverage': 0,
        'bottom': 0,
        'top': 0
      },
      'precipitation': {
        'amount': 0,
        'type': 'none'
      },
      'sun': {
        'amount': 0.5,
      },
      'humidity': 0
    }
  }

  /**
   * TODO
   * @param {*} param0 
   */
  constructor({ regionMeteo, templateId = 'default' }) {
    Logger.debug('WeatherModel:constrctor', { 'regionMeteo': regionMeteo, 'templateId': templateId })
    this._cache = {}
    if (regionMeteo === undefined) {
      this.regionMeteo = undefined
      this.weatherData = WeatherModel.templates[templateId]
    } else {
      this.regionMeteo = regionMeteo
      this.update()
    }
  }

  /**
   * TODO
   * @returns - array of dictionaries containing 'id' and 'name'
   */
  static getTemplates() {
    let res = []
    for (let id in WeatherModel.templates) {
      res.push({
        'id': id,
        'name': WeatherModel.templates[id].name
      })
    }
    return res
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
  update() {
    // update on potentially changed settings on the scene or default values
    // TODO    
    if (this.regionMeteo !== undefined) {
      // invalidate cache
      this._cache = {}
      // update with new settings
      this.regionMeteo.update()
    } else {
      Logger.debug('WeatherModel.update -> nothing to do.')
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
    if (this.regionMeteo === undefined) {
      return this.weatherData
    } else {
      let regionBaseValues = this.regionMeteo.getRegionBase(dayOffset, hourOffset)

      // TODO implement caching for already calculated regionBaseValues.timeHash
      if (this._cache[regionBaseValues.timeHash] !== undefined) {
        Logger.debug('WeatherModel.getWeatherData -> cacheHit')
        this.weatherData = this._cache[regionBaseValues.timeHash]
        return this._cache[regionBaseValues.timeHash]
      }

      this.weatherData = {
        'temp': {
          'ground': this._groundTemp(3, 3, dayOffset, hourOffset),
          'air': regionBaseValues.baseTemp,
          'percieved': 0
        },
        'wind': {
          'speed': regionBaseValues.wind,
          'gusts': regionBaseValues.gusts,
          'direction': 0
        },
        'clouds': {
          'coverage': 0,
          'bottom': Utils.clamp(Math.abs(WeatherModel._liftedCondensationLevel(regionBaseValues.baseTemp, regionBaseValues.baseHumidity)), 0, 20000),  // // LCL in altitude meters above sea level on ICAO standard atmosphere up to 20km
          'top': 0,
          'type': 0 // 0: none, 1:groundfog, 2:cirrus, 3:cumulus, 4:cumulunimbus
        },
        'precipitation': {
          'amount': 0,
          'type': 0 // 0: none, 1:drizzle, 2:rain, 3:downpour, 4:hail, 5:snow, 6:blizzard
        },
        'sun': {
          'amount': regionBaseValues.sunAmount,
        },
        'humidity': regionBaseValues.baseHumidity
      }

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
          if (this.weatherData.clouds.coverage > 0.7) {
            this.weatherData.clouds.type = 2 // Cirrus
          }
        }
      }

      // Calculate precipitation amount
      this.weatherData.precipitation.amount = Utils.clamp(this.weatherData.clouds.coverage * 1.4 - 0.4, 0, 1) * this.regionMeteo._getNoisedValue(regionBaseValues.timeHash + 321, 8, 0.8, 0.2)

      // Recalculate gusts depending on rain amount
      this.weatherData.wind.gusts = this.weatherData.wind.gusts * (this.weatherData.precipitation.amount * 1.5)

      // Recalculate wind speed depending on rain amount
      this.weatherData.wind.speed = this.weatherData.wind.speed + (this.weatherData.precipitation.amount * 1.2) * this.weatherData.wind.speed

      // Recalculate sun amount based on cloud coverage
      this.weatherData.sun.amount = this.weatherData.sun.amount * (1 - this.weatherData.clouds.coverage)

      // Recalculate ground temperature based on sun, rain and wind
      this.weatherData.temp.air = this.weatherData.temp.air - (this.weatherData.wind.speed * 0.3) + (this.weatherData.sun.amount * Math.max(2, this.weatherData.temp.ground * 0.6))
      this.weatherData.temp.percieved = WeatherModel._apparentTemperature(this.weatherData.temp.air, this.weatherData.wind.speed, this.weatherData.humidity, WeatherModel._heightToPressure(regionBaseValues.elevation))

      // set cloud altitudes to hight in meters based on the scene's elevation
      this.weatherData.clouds.top = Math.max(0, this.weatherData.clouds.top - regionBaseValues.elevation)
      this.weatherData.clouds.bottom = Math.max(0, this.weatherData.clouds.bottom - regionBaseValues.elevation)

      // Calculate ptecipitation type
      this.weatherData.precipitation.type = WeatherModel._calcPrecipitationType(this.weatherData)

      // Calculate wind direction just for fanyness
      this.weatherData.wind.direction = this.regionMeteo._getNoisedValue(regionBaseValues.timeHash + 1277, 512, 180, 180)
      this.weatherData.wind.direction = this.weatherData.wind.direction + (this.regionMeteo._getNoisedValue(regionBaseValues.timeHash + 1277, 8, 16, 16) * this.weatherData.wind.gusts)
      if (this.weatherData.wind.direction < 0) this.weatherData.wind.direction += 360
      if (this.weatherData.wind.direction >= 360) this.weatherData.wind.direction -= 360

      // Store in cache
      this._cache[regionBaseValues.timeHash] = this.weatherData
      return this.weatherData
    }
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
    if (temperature < 27 || R < 0.40 || WeatherModel._dewPoint(temperature, humidity) < 12) return temperature

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
    const a = 17.27;  // 1974 Psychrometry and Psychrometric Charts
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
    if (weatherData.precipitation.amount < 10) {
      // less then 10% amount, we assume it is not raining at all
      return 0 // none
    } else {
      if (weatherData.clouds.type > 3 && weatherData.precipitation.amount > 70) {
        // CB(4+)
        if (weatherData.temp.air < 4) {
          return 6 // blizzard
        } else {
          if (weatherData.wind.speed > 20) {
            return 4 // hail
          } else {
            return 3 // downpour
          }
        }
      } else if (weatherData.clouds.type >= 3) {
        // CU(3)
        if (weatherData.temp.air < 4) {
          if (weatherData.wind.speed > 20) {
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
        if (weatherData.precipitation.amount > 70) {
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
    return 125 * (temperature - WeatherModel._dewPoint(temperature, humidity))
  }

}
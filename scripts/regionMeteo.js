import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { WeatherModel } from './weatherModel.js'

/**
 *  RegionMeteo in combination with TimeOfDy/DayInYear will generate WeatherModel
 */
export class RegionMeteo {

  static templates = {
    'plains': {
      'name': 'Plains',
      'elevation': 200,
      'vegetation': 40,
      'waterAmount': 5,
      'summer': {
        'temperature': {
          'max': 27,
          "avg": 25,
          "min": 22,
          "var": 3
        },
        "humidity": {
          "max": 80,
          "avg": 65,
          "min": 50,
          "var": 10
        },
        "wind": {
          "avg": 5,
          "var": 5
        }
      },
      'winter': {
        'temperature': {
          'max': 15,
          "avg": 7,
          "min": 2,
          "var": 5
        },
        "humidity": {
          "max": 60,
          "avg": 40,
          "min": 30,
          "var": 10
        },
        "wind": {
          "avg": 10,
          "var": 8
        }
      }
    }
  }


  /**
   * Region Automatic lets you set RegionMeteo. uses TimeOfDy/DayInYear
   * @param {*} templateId 
   */
  constructor(templateId) {
    Logger.debug('RegionMeteo:constrctor', { 'templateId': templateId })
    if (templateId !== undefined) {
      // TOOD set parameters from template
      this.regionData = RegionMeteo.templates[templateId]
    } else {
      // TODO set parameters from scene config of if none found, from game defaults
      this.regionData = canvas.scene.getFlag(MODULE.ID, 'regionSettings')
    }
  }

  /**
  * TODO
  * @returns - array of dictionaries containing 'id' and 'name'
  */
  static getTemplates() {
    let res = []
    for (let id in RegionMeteo.templates) {
      res.push({
        'id': id,
        'name': RegionMeteo.templates[id].name
      })
    }
    Logger.debug('getTemplates', { 'res': res })
    return res
  }

  /**
   * Region Template sets specific RegionMeteo as well as given TimeOfDay/SeasonInYear
   * @param {*} templateId 
   * @returns 
   */
  static fromTemplate(templateId) {
    return new RegionMeteo(templateId) // from template
  }

  /**
   * TODO
   */
  async update() {
    // Updatr based on hourOfDay and dayInYear        
  }

  /**
   * Calculate the cloud bottom height using the temperature and humidity at ground level as inputs:
   * let temperature = 20 // degrees Celsius
   * let humidity = 60 // percent
   * let height = cloudBottomHeight(temperature, humidity)
   * console.log(`Cloud bottom height: ${height} meters`)
  */
  cloudBottomHeight(temperature, humidity) {
    // Constants used in the formula
    const T0 = 273.15 // Kelvin
    const R = 8.31 // Universal gas constant
    const M = 18.02 / 1000 // Molecular weight of water
    const g = 9.8 // Acceleration due to gravity
    const L = 2.5 * 10 ** 6 // Latent heat of vaporization

    // Calculate the saturation vapor pressure
    let es = 6.11 * 10 ** (7.5 * (temperature - T0) / (temperature - T0 + 237.3))

    // Calculate the actual vapor pressure
    let e = humidity / 100 * es

    // Calculate the virtual temperature
    let Tv = temperature * (1 + 0.61 * e / (R * temperature / M))

    // Calculate the cloud bottom height
    let h = ((R * Tv) / g) * (L / R) * (1 / (Tv - T0) - 1 / temperature)

    return h
  }

  /**
   * Calculates the cloud top height using the temperature and humidity at ground level as inputs:
   * let temperature = 20 // degrees Celsius
   * let humidity = 60 // percent
   * let height = cloudTopHeight(temperature, humidity)
   * console.log(`Cloud top height: ${height} meters`)
   */
  cloudTopHeight(temperature, humidity) {
    // Constants used in the formula
    const T0 = 273.15 // Kelvin
    const R = 8.31 // Universal gas constant
    const M = 18.02 / 1000 // Molecular weight of water
    const g = 9.8 // Acceleration due to gravity
    const L = 2.5 * 10 ** 6 // Latent heat of vaporization

    // Constants used to calculate the cloud top height
    const Tt = -56.5 + 273.15 // Temperature in Kelvin at cloud top
    const Rv = 461 // Specific gas constant for water vapor

    // Calculate the saturation vapor pressure
    let es = 6.11 * 10 ** (7.5 * (temperature - T0) / (temperature - T0 + 237.3))

    // Calculate the actual vapor pressure
    let e = humidity / 100 * es

    // Calculate the virtual temperature
    let Tv = temperature * (1 + 0.61 * e / (R * temperature / M))

    // Calculate the saturation vapor pressure at the cloud top temperature
    let ess = 6.11 * 10 ** (7.5 * (Tt - T0) / (Tt - T0 + 237.3))

    // Calculate the actual vapor pressure at the cloud top temperature
    let ee = e * (Tt / Tv) ** (Rv / R)

    // Calculate the cloud top height
    let h = (Rv * Tt) / g * log(ee / ess)

    return h;
  }

  /**
   * Calculates the amount of cloud coverage in percent using temperature in Celsius and relative humidity at ground level as inputs:
   * let temperature = 20 // degrees Celsius
   * let humidity = 60 // percent
   * let coverage = cloudCoverage(temperature, humidity)
   * console.log(`Cloud coverage: ${coverage}%`)
   */
  cloudCoverage(temperature, humidity) {
    // Constants used in the formula
    const T0 = 273.15 // Kelvin
    const R = 8.31 // Universal gas constant
    const M = 18.02 / 1000 // Molecular weight of water
    const epsilon = 0.622 // Ratio of molecular weight of water to air

    // Calculate the saturation vapor pressure
    let es = 6.11 * 10 ** (7.5 * (temperature - T0) / (temperature - T0 + 237.3))

    // Calculate the actual vapor pressure
    let e = humidity / 100 * es

    // Calculate the mixing ratio
    let w = epsilon * e / (es - e)

    // Calculate the cloud coverage in percent
    let coverage = 100 * (w / (w + 0.622))

    return coverage
  }

  /**
   * Calculates the cloud top height using the temperature and humidity at ground level as inputs:
   */
  cloudTopHeight2(temperature, humidity) {
    // Constants used in the formula
    const T0 = 273.15 // Kelvin
    const R = 8.31 // Universal gas constant
    const M = 18.02 / 1000 // Molecular weight of water
    const g = 9.8 // Acceleration due to gravity
    const L = 2.5 * 10 ** 6 // Latent heat of vaporization

    // Constants used to calculate the cloud top height
    const Tt = -56.5 + 273.15 // Temperature in Kelvin at cloud top
    const Rv = 461 // Specific gas constant for water vapor

    // Calculate the saturation vapor pressure
    let es = 6.11 * 10 ** (7.5 * (temperature - T0) / (temperature - T0 + 237.3))

    // Calculate the actual vapor pressure
    let e = humidity / 100 * es

    // Calculate the virtual temperature
    let Tv = temperature * (1 + 0.61 * e / (R * temperature / M))

    // Calculate the saturation vapor pressure at the cloud top temperature
    let ess = 6.11 * 10 ** (7.5 * (Tt - T0) / (Tt - T0 + 237.3))

    // Calculate the actual vapor pressure at the cloud top temperature
    let ee = e * (Tt / Tv) ** (Rv / R)

    // Calculate the cloud top height
    let h = (Rv * Tt) / g * log(ee / ess)

    return h
  }

  /**
   * Calculates the air temperature at ground level using the current time, sunrise time, sunset time, and average temperature as inputs:
   * let currentTime = new Date() // Current time
   * let sunriseTime = new Date(2022, 2, 20, 5, 30) // Sunrise time
   * let sunsetTime = new Date(2022, 2, 20, 18, 30) // Sunset time
   * let avgTemperature = 20 // Average temperature in degrees Celsius  
   * let temperature = airTemperature(currentTime, sunriseTime, sunsetTime, avgTemperature)
   * console.log(`Air temperature at ground level: ${temperature}°C`)
   */
  airTemperature(currentTime, sunriseTime, sunsetTime, avgTemperature) {
    // Calculate the time difference in minutes
    let diffCurrentSunrise = (currentTime - sunriseTime) / 1000 / 60
    let diffSunsetCurrent = (sunsetTime - currentTime) / 1000 / 60

    // Calculate the temperature at ground level
    let temperature = avgTemperature + 2 * avgTemperature * (diffCurrentSunrise / (diffCurrentSunrise + diffSunsetCurrent))

    return temperature
  }

}

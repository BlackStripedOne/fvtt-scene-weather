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
import { METEO, CLOUD_TYPE, PRECI_TYPE } from './constants.js'

/**
 * Meteo utility function collection
 */
export class Meteo {

  /**
   * Precalculated cache of height (meter) to pressure (hPa)
   */
  //_heightToPressureTable = {}

  static init() {
    Logger.trace("Meteo -> precalculating pressure tables")
    // Meteo._precalcPressureTable()
  }

  /*static _precalcPressureTable() {
    Meteo._heightToPressureTable = {}
    for (let altMeters = 0; altMeters <= 3000; altMeters += 100) {
      Meteo._heightToPressureTable[altMeters] = Meteo._heightToPressure(altMeters)
    }
  }*/

  /**
   * TODO
   *
   * @param {*} weatherData
   * @returns
   */
  static getPrecipitationType(precipitationAmount, cloudType, airTemperature, windSpeed) {
    if (precipitationAmount < 0.1) {
      // less then 10% amount, we assume it is not raining at all
      return 0 // none
    } else {
      if (cloudType > 3 && precipitationAmount > 0.7) {
        // CB(4+)
        if (airTemperature < 4) {
          return PRECI_TYPE.blizzard
        } else {
          if (windSpeed > 0.2) {
            return PRECI_TYPE.hail // hail
          } else {
            return PRECI_TYPE.downpour // downpour
          }
        }
      } else if (cloudType >= 3) {
        // CU(3)
        if (airTemperature < 4) {
          if (windSpeed > 0.2) {
            return PRECI_TYPE.blizzard // blizzard
          } else {
            return PRECI_TYPE.snow // snow
          }
        } else {
          return 2 // rain
        }
      } else if (cloudType == 2) {
        // ST(2)
        if (airTemperature < 4) {
          return PRECI_TYPE.snow // snow
        } else {
          return PRECI_TYPE.drizzle // drizzle
        }
      } else {
        // FG(1) or NONE(0)
        if (precipitationAmount > 0.7) {
          if (airTemperature < 4) {
            return PRECI_TYPE.snow // snow
          } else {
            return PRECI_TYPE.drizzle // drizzle
          }
        } else {
          return PRECI_TYPE.none // none
        }
      }
    }
  }

  /**
   * TODO
   */
  static getCloudType(elevation, bottom, top, coverage, tempCoefficient) {
    /* if (bottom < elevation) {
       // In clouds
       return CLOUD_TYPE.fog // Fog
     } else {
       // below clouds
       let cloudType = CLOUD_TYPE.none
       if (tempCoefficient < 0) {
         if (top - bottom > 1000) {
           cloudType = CLOUD_TYPE.cumulus // Cumulus
         }
         if (top - bottom > 3000) {
           cloudType = CLOUD_TYPE.cumulunimbus // Cumulu Numbus Extremis
         }
       }
       if (cloudType < CLOUD_TYPE.cumulus) {
         if (coverage > 0.3) {
           cloudType = CLOUD_TYPE.stratus // Stratus
         }
       }
       return cloudType
     }*/
    if (bottom < elevation) {
      // In clouds
      return CLOUD_TYPE.fog // Fog
    }
    if (tempCoefficient < 0) {
      if (top - bottom > 1000) {
        return CLOUD_TYPE.cumulus // Cumulus
      } else if (top - bottom > 3000) {
        return CLOUD_TYPE.cumulonimbus // Cumulonimbus Extremis
      }
    }
    if (coverage > 0.3) {
      return CLOUD_TYPE.stratus // Stratus
    }
    return CLOUD_TYPE.none
  }



  /**
   * TODO
   */
  static calcCloudCoverate(bottom, top) {
    const cloudLayerThinckness = (top - bottom) / 100
    return Utils.clamp(cloudLayerThinckness, 0, 1)
  }

  /**
   * TODO
   */
  static calcCloudTops(tempCoifficient, cloudBottom, vegetation, sunAmount, wind, waterAmount) {
    const geopotential = Meteo.calcGeopotential(vegetation, sunAmount, wind, waterAmount)
    // check wether we have at the equilibrium of moist adiabatic raising a positive or negative temperature coefficient
    // which yields cumulu forming vs. cirrus forming
    const geopotentialRaisingFactor = (tempCoifficient < 0) ? 12.6 : 0.27
    const tops = cloudBottom + geopotential * geopotentialRaisingFactor
    return tops
  }

  /**
   * Calculates geopotential based on the given input parameters.
   * @param {Object} baseValues - The base values object containing vegetation, sunAmount, wind, and waterAmount properties.
   * @param {number} baseValues.vegetation - The vegetation value.
   * @param {number} baseValues.sunAmount - The sun amount value. [0,100]
   * @param {number} baseValues.wind - The wind value. [0,METEO.VwindMax]
   * @param {number} baseValues.waterAmount - The water amount value. [0,100]
   * @returns {number} The calculated geopotential value. [0,13086]
   */
  static calcGeopotential(vegetation, sunAmount, wind, waterAmount) {
    const geopotential = (
      vegetation * (sunAmount * 1.3 + wind * 0.7) + // vegetation based evaporation
      (sunAmount * 0.3 + waterAmount * (wind * 1.3))  // water body based evaporation
    )
    return geopotential
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
  /*static heightToPressure(altitude) {
   const altitudes = Object.keys(Meteo._heightToPressureTable)
  const pressures = Object.values(Meteo._heightToPressureTable)
  
  // find the index of the closest altitude in the table
  const index = altitudes.reduce((closestIndex, currentAltitude, currentIndex) => {
    const closestDistance = Math.abs(altitude - altitudes[closestIndex])
    const currentDistance = Math.abs(altitude - currentAltitude)
    return currentDistance < closestDistance ? currentIndex : closestIndex
  }, 0)
  
  // return the pressure at the closest altitude
  return pressures[index]
  }
  */

  /*static _heightToPressure(altMeters) {
    const mslPressurePa = METEO.isaSeaLevelPa
    const tempK = METEO.isaMSLtempC + 273.15  // from C to K
    if (altMeters < 11000) {
      return (mslPressurePa * Math.pow(tempK / (tempK + (METEO.adiabaticHyDryCoeff * altMeters)), (METEO.g * METEO.mAir) / (METEO.R * METEO.adiabaticHyDryCoeff))) / 100
    } else if (altMeters <= 20000) {
      const plateuPres = mslPressurePa * Math.pow(tempK / (tempK + (METEO.adiabaticHyDryCoeff * 11000)), (METEO.g * METEO.mAir) / (METEO.R * METEO.adiabaticHyDryCoeff))
      const mesoSpCoeff  = tempK + (11000 * (METEO.adiabaticHyDryCoeff))
      return (plateuPres * Math.exp(((-METEO.g) * METEO.mAir * (altMeters - 11000)) / (METEO.R * mesoSpCoeff ))) / 100
    } else {
      // Assume no pressure beyond this point
      return 0
    }
  }*/

  /**
   * Get apparent temperature. Use wind chill or heat index.
   *
   * @param {number} temperature - temperature in celsius [-30,50]
   * @param {number} windSpeed - wind speed in km/h [0,]
   * @param {number} humidity - relative humidity [0,100]
   * @returns {number} the apparent temperature in degrees celsius
   *
   * @private
   */
  static apparentTemperature(temperature, windSpeed, humidity) {
    if (temperature < 10) {
      return Meteo.windChill(temperature, windSpeed)
    } else {
      return Meteo.heatIndex(temperature, humidity)
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
  static windChill(temperature, windSpeed) {
    if (temperature >= 10) return temperature
    if (windSpeed >= 4.8 && windSpeed <= 177) {
      // stronger wind cooling with more precise polynomial approximation
      return (
        13.12 + 0.6215 * temperature + (0.3965 * temperature - 11.37) * Math.pow(windSpeed, 0.16)
      )
    } else if (windSpeed < 4.8) {
      // less wind cooling with faster polynomial approximation
      return temperature + 0.2 * (0.1345 * temperature - 1.59) * windSpeed
    } else {
      return temperature
    }
  }


  /**
   * Heat index calculation.
   * @see https://en.wikipedia.org/wiki/Heat_index
   *
   * @param {number} temperature - temperature in celsius [-30, 50]
   * @param {number} humidity - relative humidity [0,100]
   * @returns {number}
   *
   * @private
   */
  static heatIndex(temperature, humidity) {
    const c1 = -8.784695
    const c2 = 1.61139411
    const c3 = 2.338549
    const c4 = -0.14611605
    const c5 = -1.2308094 * 0.01
    const c6 = -1.6424828 * 0.01
    const c7 = 2.211732 * 0.001
    const c8 = 7.2546 * 0.0001
    const c9 = -3.582 * 0.000001

    const temperatureSqr = temperature ** 2
    const humiditySqr = humidity ** 2

    return (
      c1 +
      c2 * temperature +
      c3 * humidity +
      c4 * temperature * humidity +
      c5 * temperatureSqr +
      c6 * humiditySqr +
      c7 * temperatureSqr * humidity +
      c8 * temperature * humiditySqr +
      c9 * temperatureSqr * humiditySqr
    )
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
  /*static dewPoint(temperature, humidity) {
    Logger.trace('Meteo.dewPoint(...)', {'temperature':temperature, 'humidity':humidity})
    humidity = humidity / 100
    if (temperature < 0 || temperature > 60) return temperature
    if (humidity < 0.01 || humidity > 1) return temperature
    const a = 17.27 // 1974 Psychrometry and Psychrometric Charts
    let alphaTR = (a * temperature) / (METEO.Tzero + temperature) + Math.log(humidity)
    let relativeTemperature = (METEO.Tzero * alphaTR) / (a - alphaTR)
    if (relativeTemperature < 0 || relativeTemperature > 50) return temperature
    return relativeTemperature
  }*/

  /**
   * Determin wether we have positive cooling coefficient or negative one based on geopotential and temperature gradient
   *
   * @param {*} weatherData
   * @param {*} baseValues
   * @returns
   */
  //weatherData, baseValues
  static calcAdiCloudBottomCoeff(cloudBottom, elevation, baseTemp) {
    /*const cloudBottom = weatherData.clouds.bottom
    const elevation = baseValues.elevation
    const baseTemp = baseValues.baseTemp*/
    let isaTempAtBase = METEO.isaMSLtempC + (cloudBottom - elevation) * METEO.adiabaticHyDryCoeff
    let tempAtBase = baseTemp + (cloudBottom - elevation) * METEO.adiabaticHyDryCoeff
    Logger.trace('Meteo.calcAdiCloudBottomCoeff(...)', { 'cloudBottom': cloudBottom, 'elevation': elevation, 'baseTemp': baseTemp, 'coeff': (isaTempAtBase - tempAtBase) })
    return isaTempAtBase - tempAtBase // negatie means rising -> cumulus clouds
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
  static liftedCondensationLevel(temperature, humidity) {
    let Td = temperature - (100 - humidity) / 5
    return 125 * (temperature - Td)
  }

  /**
   * Calculates the relative humidity for a new temperature with the same mass of air.
   *
   * @param {number} temperatureInCelsius - The current temperature in degrees Celsius.
   * @param {number} relativeHumidity - The current relative humidity as a percentage.
   * @param {number} newTemperatureInCelsius - The new temperature in degrees Celsius.
   * @returns {number} - The new relative humidity as a percentage.
   *
   * @example
   * // Returns approximately 58.7
   * calculateRelativeHumidity(25, 50, 30)
   */
  static calculateRelativeHumidityTransfer(
    temperatureInCelsius,
    relativeHumidity,
    newTemperatureInCelsius
  ) {
    // Calculate the saturation vapor pressure at the current temperature
    const saturationVaporPressure =
      6.11 * Math.pow(10, (7.5 * temperatureInCelsius) / (237.3 + temperatureInCelsius))

    // Calculate the actual vapor pressure at the current relative humidity
    const actualVaporPressure = (relativeHumidity / 100) * saturationVaporPressure

    // Calculate the saturation vapor pressure at the new temperature
    const newSaturationVaporPressure =
      6.11 * Math.pow(10, (7.5 * newTemperatureInCelsius) / (237.3 + newTemperatureInCelsius))

    // Calculate the new relative humidity
    const newRelativeHumidity = (actualVaporPressure / newSaturationVaporPressure) * 100

    return Utils.clamp(Math.round(newRelativeHumidity), 0, 100)
  }
}

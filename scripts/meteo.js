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

import { MODULE } from './constants.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { Logger, Utils } from './utils.js'

/**
 * Meteo utility function collection
 */
export class Meteo {

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
  static calculateRelativeHumidityTransfer(temperatureInCelsius, relativeHumidity, newTemperatureInCelsius) {
    // Calculate the saturation vapor pressure at the current temperature
    const saturationVaporPressure = 6.11 * Math.pow(10, ((7.5 * temperatureInCelsius) / (237.3 + temperatureInCelsius)))

    // Calculate the actual vapor pressure at the current relative humidity
    const actualVaporPressure = (relativeHumidity / 100) * saturationVaporPressure

    // Calculate the saturation vapor pressure at the new temperature
    const newSaturationVaporPressure = 6.11 * Math.pow(10, ((7.5 * newTemperatureInCelsius) / (237.3 + newTemperatureInCelsius)))

    // Calculate the new relative humidity
    const newRelativeHumidity = (actualVaporPressure / newSaturationVaporPressure) * 100

    return Utils.clamp(Math.round(newRelativeHumidity), 0, 100)
  }

}

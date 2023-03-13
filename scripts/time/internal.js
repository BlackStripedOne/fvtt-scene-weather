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

import { TIME_PROVIDERS } from '../constants.js'
import { Logger } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { TimeProvider } from '../timeProvider.js'

Hooks.once("init", () => {
  Logger.debug('->Hook:InternalTimeProvider.init()')
  TimeProvider._instances[TIME_PROVIDERS.INTERNAL] = new InternalTimeProvider(true)
  TimeProvider._instances[TIME_PROVIDERS.EXTERNAL] = new InternalTimeProvider(false)
})

/**
 * This class represents an internal time provider that extends the `TimeProvider` class.
 * It provides functionality to control the game time, including advancing the time, getting the current time,
 * and getting the hour and day of the year as percentiles. It also has authority over time control.
 *
 * @extends TimeProvider
 */
export class InternalTimeProvider extends TimeProvider {

  /**
   * Creates a new instance of the `InternalTimeProvider` class with the specified authority status.
   *
   * @param {boolean} [hasAuthority=false] - Whether this module has authority over time control.
   */
  constructor(hasAuthority = false) {
    super()
    Logger.debug('InternalTimeProvider:ctor(...)', { 'hasAuthority': hasAuthority })
    // Whether this module has authority over time control.
    this._hasAuthoriy = hasAuthority
    // An array that holds the days summed up for each previous month, for faster calculation.
    this._monthOffset = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]	// Days summed up for each previous months for faster calculation
  }


  /**
   * @override
   */
  hasTimeAuthority() {
    return this._hasAuthoriy
  }

  /**
   * @override
   */
  async advanceGameTime(deltaSeconds = 0) {
    Logger.debug('InternalTimeProvider.advanceGameTime(...)', { 'deltaSeconds': deltaSeconds })
    if (this._hasAuthoriy) {
      // TODO dependant on provider
      if (deltaSeconds == 0) return

      //Set the world time, this will trigger the updateWorldTime hook on all connected players
      if (Fal.isGm()) {
        const currentWorldTime = Fal.getWorldTime()
        const newTime = await Fal.advanceWorldTime(deltaSeconds)
      }
    }
  }

  /**
   * @override
   */
  getHoursInDay() {
    return 25
  }

  /**
   * @override
   */
  getNumberOfMonths() {
    return 12
  }

  /**
   * @override
   */
  getMonthOffset(monthNr) {
    return this._monthOffset[Utils.clamp(monthNr, 0, 11)]
  }

  /**
   * @override
   */
  getDayOfYear(dayDelta = 0, hourDelta = 0) {
    const date = new Date((Fal.getWorldTime() + (hourDelta * 3600) + (dayDelta * 86400)) * 1000)
    const doY = this._monthOffset[date.getMonth()] + date.getDate()
    Logger.debug('InternalTimeProvider.getDayOfYear()', { 'month#': date.getMonth(), 'day#': date.getDate(), 'doY': doY })
    return doY
  }

  /**
   * @override
   */
  getHourOfDay(dayDelta = 0, hourDelta = 0) {
    const currentWorldTime = Fal.getWorldTime() + (hourDelta * 3600) + (dayDelta * 86400)
    const dayTime = Math.abs(Math.trunc((currentWorldTime % 86400) / 3600))
    Logger.debug('InternalTimeProvider.getHourOfDay()', { 'currentWorldTime': currentWorldTime, 'dayTime': dayTime })
    if (currentWorldTime < 0) {
      return 24 - dayTime
    } else return dayTime
  }

  /**
   * @override
   */
  hourOfDayNoonPct(dayDelta = 0, hourDelta = 0) {
    // Normalize hour value to the range [0, 24)
    const hourOfDay = TimeProvider.getHourOfDay(dayDelta, hourDelta) % 24
    return (Math.sin(((hourOfDay / 12) - 0.5) * (Math.PI)) + 1) / 2	// TODO may use sinetable for speed
  }

  /**
   * @override
   */
  dayOfYearSummerPct(dayDelta = 0, hourDelta = 0) {
    let dayOfYear = TimeProvider.getDayOfYear(dayDelta, hourDelta)
    if (dayOfYear > 355) dayOfYear -= 365
    let pct
    if (dayOfYear == 172) {
      pct = 1
    } else if (dayOfYear < 172) {
      pct = (dayOfYear + 10) / 182
    } else {
      pct = 1 - ((dayOfYear - 172) / 183)
    }
    return pct // TODO use sine
  }

  /**
   * Returns an object with information about the current time in the form of a string.
   * 
   * @returns {object} An object containing information about the current time.
   * month: An object containing information about the current month.
   * month.number: A number representing the month (0-11).
   * month.name: A string representing the name of the month.
   * month.prefix: An optional string that can be used as a prefix for the month.
   * month.suffix: An optional string that can be used as a suffix for the month.
   * day: An object containing information about the current day.
   * day.number: A number representing the day of the month.
   * day.name: A string representing the name of the day.
   * day.prefix: An optional string that can be used as a prefix for the day.
   * day.suffix: An optional string that can be used as a suffix for the day.
   * hour: An object containing information about the current hour.
   * hour.number: A number representing the hour (0-23).
   * hour.name: A string representing the hour in two-digit format (e.g. "01").
   * hour.minute: An object containing information about the current minute.
   * hour.number: A number representing the minute (0-59).
   * hour.name: A string representing the minute in two-digit format (e.g. "05").
   */
  getTimeStringData() {
    const epoch = Fal.getWorldTime()
    const date = new Date(epoch * 1000)
    return {
      'month': {
        'number': date.getMonth(),
        'name': date.getMonth() + '#monat',
        'prefix': '',
        'suffix': ''
      },
      'day': {
        'number': date.getDate(),
        'name': date.getDate() + '#day',
        'prefix': '',
        'suffix': ''
      },
      'hour': {
        'number': date.getHours(),
        'name': (date.getHours() < 10) ? '0' + date.getHours() : date.getHours()
      },
      'minute': {
        'number': date.getMinutes(),
        'name': (date.getMinutes() < 10) ? '0' + date.getMinutes() : date.getMinutes()
      }
    }
  }

}

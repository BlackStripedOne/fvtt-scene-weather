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
import { Logger, Utils } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { TimeProvider } from '../timeProvider.js'

Hooks.once("init", () => {
  Logger.trace('->Hook:InternalTimeProvider.init()')
  TimeProvider._instances[TIME_PROVIDERS.INTERNAL] = new InternalTimeProvider(true)
  TimeProvider._instances[TIME_PROVIDERS.EXTERNAL] = new InternalTimeProvider(false)
})

/**
 * This class represents an internal time provider that extends the `TimeProvider` class.
 * It provides functionality to control the game time, including advancing the time, getting the current time,
 * and getting the hour and day of the year as percentiles. It also has authority over time control.
 *
 * TODO not heeding leap year in day-of-year calculation
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
    Logger.trace('InternalTimeProvider:ctor(...)', { 'hasAuthority': hasAuthority })
    // Whether this module has authority over time control.
    this._hasAuthoriy = hasAuthority
    // An array that holds the days summed up for each previous month, for faster calculation.
    this._monthOffset = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]	// Days summed up for each previous months for faster calculation
    this._monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    this._monthDaysLeapYear = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
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
    return 24
  }

  /**
   * @override
   */
  getDaysInYear() {
    return 365
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
  getSummerSolsticeDay() {
    return 172
  }

  /**
   * @override
   */
  getWinterSolsticeDay() {
    return 355
  }

  /**
   * @override
   */
  getDaylightCyclePct() {
    return Utils.map(this.getHourOfDay(), 0, 24, 0.0, 1.0)
  }

  /**
   * @override
   */
  getSeasonCyclePct() {
    const doY = this.getDayOfYear()
    let beforeSummerSolstice = doY < 172
    let distancePct = (beforeSummerSolstice) ? 1.0 - ((172 - doY) / 183) : (doY - 172) / 183 // 183 <- (355-1 - 172)
    if (distancePct > 1.0) {
      distancePct -= 1.0
      beforeSummerSolstice = !beforeSummerSolstice
    }
    return (beforeSummerSolstice) ? distancePct : 1.0 + distancePct
  }

  /**
   * @override
   */
  async setDaylightCyclePct(daylightCyclePct = 0.5) {
    if (this._hasAuthoriy) {
      const date = this._gameTimeToDate(Fal.getWorldTime())
      const secondsAfterMidnightCurrent = Math.trunc((date.hour * 3600) + (date.minute * 60) + date.second)
      const secondsAfterMidnightDesired = Math.trunc(Utils.map(daylightCyclePct, 0.00, 1.00, 0, 86399))  // Total seconds in a day, just one shy
      Logger.trace('InternalTimeProvider.setDaylightCyclePct()', { 'daylightCyclePct': daylightCyclePct, 'secondsAfterMidnightCurrent': secondsAfterMidnightCurrent, 'secondsAfterMidnightDesired': secondsAfterMidnightDesired })
      return this.advanceGameTime(secondsAfterMidnightDesired - secondsAfterMidnightCurrent)
    }
  }

  /**
   * @override
   */
  async setSeasonCyclePct(seasonCyclePct = 0.5) {
    if (this._hasAuthoriy) {
      const date = this._gameTimeToDate(Fal.getWorldTime())
      const doY = this._monthOffset[date.month] + date.day
      const daysAfterWinterSolsticeCurrent = (doY > 355) ? doY - 355 : doY + 10// (365 - 355)
      const daysAfterWinterSolsticeDesired = Math.trunc(Utils.map(seasonCyclePct, 0.00, 1.00, 0, 364))  // Total days in the year, just one shy      
      Logger.trace('InternalTimeProvider.setSeasonCyclePct()', { 'seasonCyclePct': seasonCyclePct, 'daysAfterWinterSolsticeCurrent': daysAfterWinterSolsticeCurrent, 'daysAfterWinterSolsticeDesired': daysAfterWinterSolsticeDesired })
      return this.advanceGameTime((daysAfterWinterSolsticeDesired - daysAfterWinterSolsticeCurrent) * 86400)
    }
  }

  /**
   * @override
   */
  getDayOfYear(dayDelta = 0, hourDelta = 0) {
    const date = this._gameTimeToDate(Fal.getWorldTime() + (hourDelta * 3600) + (dayDelta * 86400))
    const doY = this._monthOffset[date.month] + date.day
    Logger.trace('InternalTimeProvider.getDayOfYear()', { 'month#': date.month, 'day#': date.day, 'doY': doY })
    return doY
  }

  /**
   * @override
   */
  getHourOfDay(dayDelta = 0, hourDelta = 0) {
    const currentWorldTime = Fal.getWorldTime() + (hourDelta * 3600) + (dayDelta * 86400)
    const dayTime = Math.abs(Math.trunc((currentWorldTime % 86400) / 3600))
    Logger.trace('InternalTimeProvider.getHourOfDay()', { 'currentWorldTime': currentWorldTime, 'dayTime': dayTime })
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
   * Decodes a fractal string and returns the corresponding value for the given number.
   *
   * @param {number} number - The input number to decode.
   * @param {string} codedString - The fractal string to decode.
   * @returns {string} The decoded value for the given number.
   *
   * @example
   *
   * // returns 'st' for number = 1
   * _decodeFractalString(1, '1:st,2:nd,3:rd,4-20:th,21:st,22:nd,23:rd,24-30:th,31:st,32:nd,33:rd,34-40:th')
   *
   * // returns 'th' for number = 15
   * _decodeFractalString(15, '1:st,2:nd,3:rd,4-20:th,21:st,22:nd,23:rd,24-30:th,31:st,32:nd,33:rd,34-40:th')
   *
   * // returns 'nd' for number = 22
   * _decodeFractalString(22, '1:st,2:nd,3:rd,4-20:th,21:st,22:nd,23:rd,24-30:th,31:st,32:nd,33:rd,34-40:th')
   *
   * @description
   * The input fractal string should be formatted as a comma-separated list of key-value pairs. Each key-value
   * pair should have a range and a value separated by a colon. The range can be either a single number or a range
   * of numbers separated by a hyphen. The range specifies the numbers for which the corresponding value should
   * be returned. For example, "1:st" means that the value "st" should be returned if the input number is 1.
   * "4-20:th" means that the value "th" should be returned if the input number is between 4 and 20 (inclusive).
   */
  static _decodeFractalString(number = 0, codedString = '') {
    if (codedString == '') return ''
    let result = ''
    codedString.split(',').find(element => {
      const [range, value] = element.split(':')
      if (range.includes('-')) {
        const [start, end] = range.split('-')
        if ((number <= Number(end)) && (number >= Number(start))) {
          result = value
          return true
        }
      } else {
        if (Number(range) == number) {
          result = value
          return true
        }
      }
      return false
    })
    return result
  }

  /**
   * Test wether the given year number is a leap year by definition of the gregorian calendar
   * 
   * @param {number} year - the year number to check
   * @returns - true, in case the given year is a leap year
   * @private
   */
  static _isLeapYear(year) {
    return (year % 4 === 0 && (year % 100 !== 0 || (year % 100 === 0 && year % 400 === 0)))   // leap year rule for gregorian calendars
  }

  /**
   * Convert a given number of seconds into a date object. Faster implementation then Date.
   *
   * @param {number} [seconds=0] - The number of seconds to convert into a date object.
   * @returns {object} - An object containing the year, month, day, hour, minute, and second components of the date.
   * @throws {Error} - If the input seconds value is not a number.
   * @private
   * 
   * @example
   * // Convert 172800 seconds (2 days) into a date object
   * const date = _gameTimeToDate(172800);
   * console.log(date);
   * // Output: { year: 1970, month: 0, day: 2, hour: 0, minute: 0, second: 0 }
   */
  _gameTimeToDate(seconds = 0) {
    const beforeYearZero = seconds < 0
    seconds = Math.abs(seconds)

    let dayCount = Math.floor(seconds / 86400) // seconds per day
    seconds -= dayCount * 86400

    // calculations for the time in the day
    let timeOfDaySeconds = beforeYearZero ? 86400 - seconds : seconds
    const hour = Math.floor(timeOfDaySeconds / (3600)) % 24
    timeOfDaySeconds -= hour * 3600
    const min = Math.floor(timeOfDaySeconds / 60) % 60
    timeOfDaySeconds -= min * 60
    const sec = timeOfDaySeconds % 60

    let day, month, year, countDirection
    let isLeapYear = false  // neither starting years for the count are leap years
    if (beforeYearZero) {
      year = 1969 // start with yearzero-1
      month = 11
      day = 30
      countDirection = -1
      // special case for midnight only
      if (sec === 0 && min === 0 && hour === 0) { dayCount-- }
    } else {
      // not before year zero
      year = 1970
      month = 0
      day = 0
      countDirection = 1
    }

    while (dayCount > 0) {
      const yearTotalDays = isLeapYear ? 366 : 365
      let monthDays = isLeapYear ? this._monthDaysLeapYear[month] : this._monthDays[month]
      if (dayCount >= yearTotalDays) {
        year += countDirection
        isLeapYear = InternalTimeProvider._isLeapYear(year)
        if (countDirection < 0) {
          monthDays = isLeapYear ? this._monthDaysLeapYear[month] : this._monthDays[month]
        }
        dayCount = dayCount - yearTotalDays
      } else if (dayCount >= monthDays) {
        month += countDirection
        // check the new month to see if it has days for this year, if not then skip to the previous months until a month with days this year is found.
        let newMonthDays = isLeapYear ? this._monthDaysLeapYear[month] : this._monthDays[month]
        let safetyCounter = 0
        while (newMonthDays === 0 && safetyCounter <= 12) {
          month += countDirection
          newMonthDays = isLeapYear ? this._monthDaysLeapYear[month] : this._monthDays[month]
          safetyCounter++
        }
        if (countDirection < 0) {
          day = isLeapYear ? this._monthDaysLeapYear[month] - 1 : this._monthDays[month] - 1
        }
        dayCount = dayCount - monthDays
      } else {
        day += countDirection
        dayCount--
      }
    }

    // add one after counting forwards
    if (countDirection > 0 && year < 0) { day++ }

    return {
      'year': year,
      'month': month,
      'day': day,
      'hour': hour,
      'minute': min,
      'second': sec
    }
  }

  /**
   * Returns an object with information about the current time in the form of a string.
   * 
   * @returns {object} An object containing information about the current time.
   * month: An object containing information about the current month.
   * month.number: A number representing the month (1-12).
   * month.name: A string representing the name of the month.
   * month.prefix: An optional string that can be used as a prefix for the month.
   * month.suffix: An optional string that can be used as a suffix for the month.
   * day: An object containing information about the current day.
   * day.number: A number representing the day of the month (1-31).
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
    const date = this._gameTimeToDate(epoch)
    return {
      'month': {
        'number': Number(date.month),
        'name': Fal.i18n('time.months.' + date.month),
        'prefix': InternalTimeProvider._decodeFractalString(date.month + 1, Fal.i18n('time.monthPrefixTypes')),
        'suffix': InternalTimeProvider._decodeFractalString(date.month + 1, Fal.i18n('time.monthSuffixTypes'))
      },
      'day': {
        'number': Number(date.day),
        'name': String(date.day + 1),
        'prefix': InternalTimeProvider._decodeFractalString(date.day + 1, Fal.i18n('time.dayPrefixTypes')),
        'suffix': InternalTimeProvider._decodeFractalString(date.day + 1, Fal.i18n('time.daySuffixTypes'))
      },
      'hour': {
        'number': Number(date.hour),
        'name': (date.hour < 10) ? '0' + date.hour : String(date.hour)
      },
      'minute': {
        'number': Number(date.minute),
        'name': (date.minute < 10) ? '0' + date.minute : String(date.minute)
      }
    }
  }

}

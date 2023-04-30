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

import { TIME_PROVIDERS } from '../constants.js'
import { Logger } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { TimeProvider } from './timeProvider.js'

Hooks.once('init', () => {
  Logger.trace('->Hook:init -> ScTimeProvider.init()')
  if (Fal.isModuleEnabled('foundryvtt-simple-calendar')) {
    TimeProvider._instances[TIME_PROVIDERS.SIMPLE_CALENDAR] = new ScTimeProvider()
  }
})

Hooks.once('simple-calendar-init', () => {
  Logger.trace('->Hook:simple-calendar-init -> ScTimeProvider.initConfig()')
  if (Fal.isModuleEnabled('foundryvtt-simple-calendar')) {
    ScTimeProvider.initConfig()
  }
})

/**
 * A subclass of `TimeProvider` that provides time-related functionality specific to the Simple Calendar module for FoundryVTT.
 *
 * @extends TimeProvider
 */
export class ScTimeProvider extends TimeProvider {
  /**
   * The `_config` property holds an object that stores the default configuration for the ScTimeProvider class.
   *
   * This configuration is used as a fallback if the FoundryVTT Simple Calendar module is not installed, as it provides
   * the configuration for the calendar used in-game. The values for the different properties in this object are as follows:
   *
   * - `daysInYear` (number): the number of days in a year
   * - `summerSolstice` (number): the day of the year when the summer solstice occurs
   * - `winterSolstice` (number): the day of the year when the winter solstice occurs
   * - `monthOffset` (array): an array that stores the number of days that have passed since the start of the year for each month.
   *                          The first element in the array is always 0, the second is the number of days in January, the third is
   *                          the sum of the number of days in January and February, and so on, up to the last element, which is the
   *                          sum of the number of days in all months.
   * - `hoursInDay` (number): the number of hours in a day
   * - `minutesInHour` (number): the number of minutes in an hour
   * - `secondsInMinute` (number): the number of seconds in a minute
   * - `secondsInHour` (number): the number of seconds in an hour
   * - `secondsInDay` (number): the number of seconds in a day
   *
   * Note that these values are used to calculate various time-related properties and methods of the `ScTimeProvider` class, such as
   * the number of months in a year, the offset for each month, the number of hours in a day, and so on. If the Simple Calendar module
   * is installed and enabled, these values will be replaced by the actual configuration of the in-game calendar.
   */
  static _config = {
    daysInYear: 365,
    summerSolstice: 172,
    winterSolstice: 355,
    monthOffset: [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    hoursInDay: 24,
    minutesInHour: 60,
    secondsInMinute: 60,
    secondsInHour: 3600,
    secondsInDay: 86400
  }

  /**
   * Creates a new instance of the `ScTimeProvider` class.
   */
  constructor() {
    super()
    Logger.trace('ScTimeProvider:ctor()')
  }

  /**
   * @override
   */
  hasTimeAuthority() {
    return false
  }

  /**
   * @override
   */
  async advanceGameTime(deltaSeconds = 0) {
    Logger.warn('ScTimeProvider.advanceGameTime(...) -> no time authority, ignoring')
  }

  /**
   * @override
   */
  getHoursInDay() {
    return ScTimeProvider._config.hoursInDay
  }

  /**
   * @override
   */
  getDaysInYear() {
    return ScTimeProvider._config.daysInYear
  }

  /**
   * @override
   */
  getNumberOfMonths() {
    return ScTimeProvider._config.monthOffset.length
  }

  /**
   * @override
   */
  getMonthOffset(monthNr) {
    return ScTimeProvider._config.monthOffset[
      Utils.clamp(monthNr, 0, ScTimeProvider._config.monthOffset.length - 1)
    ]
  }

  /**
   * @override
   */
  getSummerSolsticeDay() {
    return ScTimeProvider._config.summerSolstice
  }

  /**
   * @override
   */
  getWinterSolsticeDay() {
    return ScTimeProvider._config.winterSolstice
  }

  /**
   * @override
   */
  getDaylightCyclePct() {
    return Utils.map(this.getHourOfDay(), 0, ScTimeProvider._config.hoursInDay, 0.0, 1.0)
  }

  /**
   * @override
   */
  getSeasonCyclePct() {
    const ssD = ScTimeProvider._config.summerSolstice
    const wsD = ScTimeProvider._config.winterSolstice
    const doY = this.getDayOfYear()
    const summerWinterSolsticeDeltaDays = wsD > ssD ? wsD - ssD : ssD - wsD
    let beforeSummerSolstice = doY < ssD
    let distancePct = beforeSummerSolstice
      ? 1.0 - (ssD - doY) / summerWinterSolsticeDeltaDays
      : (doY - ssD) / summerWinterSolsticeDeltaDays
    if (distancePct > 1.0) {
      distancePct -= 1.0
      beforeSummerSolstice = !beforeSummerSolstice
    }
    return beforeSummerSolstice ? distancePct : 1.0 + distancePct
  }

  /**
   * @override
   */
  async setDaylightCyclePct(daylightCyclePct) {
    Logger.trace('ScTimeProvider.setDaylightCyclePct(...) no time authority!', {
      daylightCyclePct: daylightCyclePct
    })
  }

  /**
   * @override
   */
  async setSeasonCyclePct(seasonCyclePct) {
    Logger.trace('ScTimeProvider.setSeasonCyclePct(...) no time authority!', {
      seasonCyclePct: seasonCyclePct
    })
  }

  /**
   * @override
   */
  getDayOfYear(dayDelta = 0, hourDelta = 0) {
    const scInstance = SimpleCalendar.api.timestampToDate(
      Fal.getWorldTime() +
        hourDelta * ScTimeProvider._config.secondsInHour +
        dayDelta * ScTimeProvider._config.secondsInDay
    )
    Logger.trace('ScTimeProvider.getDayOfYear()', {
      scInstance: scInstance,
      _config: ScTimeProvider._config
    })
    return ScTimeProvider._config.monthOffset[scInstance.month] + scInstance.day
  }

  /**
   * @override
   */
  getHourOfDay(dayDelta = 0, hourDelta = 0) {
    const currentWorldTime =
      Fal.getWorldTime() +
      hourDelta * ScTimeProvider._config.secondsInHour +
      dayDelta * ScTimeProvider._config.secondsInDay
    const dayTime = Math.abs(
      Math.trunc(
        (currentWorldTime % ScTimeProvider._config.secondsInDay) /
          ScTimeProvider._config.secondsInHour
      )
    )
    Logger.trace('ScTimeProvider.getHourOfDay()', {
      currentWorldTime: currentWorldTime,
      dayTime: dayTime
    })
    if (currentWorldTime < 0) {
      return ScTimeProvider._config.hoursInDay - dayTime
    } else return dayTime
  }

  /**
   * @override
   */
  hourOfDayNoonPct(dayDelta = 0, hourDelta = 0) {
    // Normalize hour value to the range [0, 24)
    const hourOfDay = this.getHourOfDay(dayDelta, hourDelta) % ScTimeProvider._config.hoursInDay
    return (Math.sin((hourOfDay / (ScTimeProvider._config.hoursInDay / 2) - 0.5) * Math.PI) + 1) / 2 // TODO may use sinetable for speed
  }

  /**
   * @override
   */
  dayOfYearSummerPct(dayDelta = 0, hourDelta = 0) {
    let dayOfYear = this.getDayOfYear(dayDelta, hourDelta)
    const summerSolstice = ScTimeProvider._config.summerSolstice
    const winterSolstice = ScTimeProvider._config.winterSolstice
    let wSb = winterSolstice
    let wSa = winterSolstice
    if (winterSolstice < summerSolstice) {
      // winter solstice is at the beginning of the year
      wSa = winterSolstice + ScTimeProvider._config.daysInYear
    } else {
      // winter solstice is at the end of the year
      wSb = winterSolstice - ScTimeProvider._config.daysInYear // may be negative
    }
    if (dayOfYear > wSa) dayOfYear -= ScTimeProvider._config.daysInYear
    let pct
    if (dayOfYear == summerSolstice) {
      pct = 1
    } else if (dayOfYear < summerSolstice) {
      pct = (dayOfYear - wSb) / (summerSolstice - wSb)
    } else {
      pct = 1 - (dayOfYear - summerSolstice) / (wSa - summerSolstice)
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
    const scInstance = SimpleCalendar.api.timestampToDate(Fal.getWorldTime())
    return {
      month: {
        number: scInstance.display.month,
        name: scInstance.display.monthName,
        prefix: '',
        suffix: ''
      },
      day: {
        number: scInstance.display.day,
        name: scInstance.display.day,
        prefix: '',
        suffix: scInstance.display.daySuffix
      },
      hour: {
        number: scInstance.hour,
        name: scInstance.hour < 10 ? '0' + scInstance.hour : scInstance.hour
      },
      minute: {
        number: scInstance.minute,
        name: scInstance.minute < 10 ? '0' + scInstance.minute : scInstance.minute
      }
    }
  }

  /**
   * Returns the number of hours in a day based on the current time zone and date.
   *
   * @private
   * @returns {number} The number of hours in a day (e.g. 24).
   */
  static _getHoursInDay() {
    return ScTimeProvider._config.hoursInDay
  }

  /**
   * (Re-)initialized the configuration for the ScTimeProvider class based on Simple Calendars settings.
   * This method is invoked each time the hook event for Simple Calendars config change and initialization is
   * issued.
   */
  static initConfig() {
    //const scInstance = SimpleCalendar.api.timestampToDate(Fal.getWorldTime())
    const months = SimpleCalendar.api.getAllMonths() || []
    const timeConfig = SimpleCalendar.api.getTimeConfiguration()
    const daysInMonth = months.map((month) => {
      return month.numberOfDays
    })
    const startingDays = ScTimeProvider._getStartingDays(daysInMonth)
    const totalDaysInYear =
      startingDays[startingDays.length - 1] + daysInMonth[daysInMonth.length - 1]

    ScTimeProvider._config = {
      providerId: TIME_PROVIDERS.SIMPLE_CALENDAR,
      daysInYear: totalDaysInYear,
      summerSolstice: 172, // will be replaced by config calculation
      winterSolstice: 355, // as well
      monthOffset: startingDays,
      hoursInDay: timeConfig.hoursInDay,
      minutesInHour: timeConfig.minutesInHour,
      secondsInMinute: timeConfig.secondsInMinute,
      secondsInHour: timeConfig.secondsInMinute * timeConfig.minutesInHour,
      secondsInDay: timeConfig.secondsInMinute * timeConfig.minutesInHour * timeConfig.hoursInDay
    }
    ScTimeProvider._calculateSolstices()
    Logger.debug('ScTimeProvider._initConfig(simple-calendar)', { _config: ScTimeProvider._config })
  }

  /**
   * Calculates the starting day of each month in a year, given the number of days in each month.
   *
   * @param {number[]} daysInMonth - An array containing the number of days in each month.
   * @returns {number[]} An array of starting days for each month in the year.
   *
   * @example
   * // Returns [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
   * getStartingDays([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
   */
  static _getStartingDays(daysInMonth) {
    const dayOffsets = daysInMonth
      .reduce(
        (acc, val) => {
          acc.push(acc[acc.length - 1] + val)
          return acc
        },
        [0]
      )
      .slice(0, -1)
    Logger.trace('ScTimeProvider._getStartingDays(...)', {
      daysInMonth: daysInMonth,
      dayOffsets: dayOffsets
    })
    return dayOffsets
  }

  /**
   * Calculates the summer and winter solstices based on information about the length of daylight during different seasons.
   * This function uses the SimpleCalendar API to retrieve information about each season, including the season's starting month
   * and day, and the length of daylight during that season.
   * It then calculates the starting day of the year for each season, based on the month and day of the season's starting date.
   * If the summer solstice or winter solstice has not been set in the ScTimeProvider configuration object, this function uses
   * the length of daylight during each season to determine which season has the longest (for summer solstice) or shortest
   * (for winter solstice) day, and sets the appropriate starting day of the year for that season as the summer solstice
   * or winter solstice.
   *
   * @private
   */
  static _calculateSolstices() {
    let seasons = []
    ScTimeProvider._config.summerSolstice = -1
    ScTimeProvider._config.winterSolstice = -1
    SimpleCalendar.api.getAllSeasons().forEach((season) => {
      const startingDay =
        ScTimeProvider._config.monthOffset[season.startingMonth] + season.startingDay
      seasons.push({
        icon: season.icon,
        dayLengthSeconds: season.sunsetTime - season.sunriseTime,
        startingDoY: startingDay
      })
      if (season.icon == 'summer') {
        ScTimeProvider._config.summerSolstice = startingDay
      }
      if (season.icon == 'winter') {
        ScTimeProvider._config.winterSolstice = startingDay
      }
    })
    const sortedSeasons = seasons.sort((a, b) => a.startingDoY - b.startingDoY)
    // for summer solstice
    if (ScTimeProvider._config.summerSolstice == -1) {
      // find season with longest sunshine duration
      const summerSeason = sortedSeasons.reduce(
        (longest, season) =>
          longest.dayLengthSeconds >= season.dayLengthSeconds ? longest : season,
        null
      )
      ScTimeProvider._config.summerSolstice = summerSeason.startingDoY
    }
    // for winter solstice
    if (ScTimeProvider._config.winterSolstice == -1) {
      // find season with shortest sunshine duration
      const winterSeason = sortedSeasons.reduce(
        (shortest, season) =>
          shortest.dayLengthSeconds <= season.dayLengthSeconds ? shortest : season,
        null
      )
      ScTimeProvider._config.winterSolstice = winterSeason.startingDoY
    }
    Logger.trace('ScTimeProvider._calculateSolstices()', {
      summerSolstice: ScTimeProvider._config.summerSolstice,
      winterSolstice: ScTimeProvider._config.winterSolstice
    })
  }
}

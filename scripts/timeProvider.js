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

import { TIME_PROVIDERS } from './constants.js'
import { Logger } from './utils.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'

/**
 * This is a utility as well as abstract base class for time/date representation and control for weather. Some weather simulations are dependant
 * on the current time of day as well as the specific day throughout the year cycle for seasons and sun positions.
 * 
 * The actual inherited class is responsible for calculating this information as well as supply various display needs for time information and 
 * time control if applicable.
 * 
 * If you are developing a module for foundry vtt that handles the game time and calendar in a certain way and want to integrate its special needs
 * into SceneWeather, look at the sample implementations in the classes InternalTimeProvider or for the integration of SimpleCalendar that is already
 * provided with this module in the ScTimeProvider class.
 */
export class TimeProvider {

  static _instances = {}

  /**
   * Returns whether this module has authority over time control.
   *
   * @returns {boolean} Whether this module has authority over time control.
   */
  static hasTimeAuthority() {
    return TimeProvider._getProviderInstance().hasTimeAuthority()
  }

  /**
   * Returns an array of available ids for TimeProvider instances.
   * 
   * @returns {string[]} - the ids of available time provider instances
   */
  static getProviderIds() {
    return Object.keys(TimeProvider._instances)
  }

  /**
   * Advances the game time by the specified number of seconds, if this module has authority over time control.
   *
   * @param {number} [deltaSeconds=0] - The number of seconds to advance the time by.
   * @returns {Promise<void>} A promise that resolves once the game time has been advanced.
   */
  static async advanceGameTime(deltaSeconds = 0) {
    return TimeProvider._getProviderInstance().advanceGameTime(deltaSeconds)
  }

  /**
   * Returns the number of hours in a day.
   *
   * @returns {number} The number of hours in a day.
   */
  static getHoursInDay() {
    return TimeProvider._getProviderInstance().getHoursInDay()
  }

  /**
   * Returns the number of months in a year.
   *
   * @returns {number} The number of months in a year.
   */
  static getNumberOfMonths() {
    return TimeProvider._getProviderInstance().getNumberOfMonths()
  }

  /**
   * Returns the sum of the days for all previous months up to the specified month number.
   *
   * @param {number} monthNr - The month number to get the sum of days for.
   * @returns {number} The sum of the days for all previous months up to the specified month number.
   */
  static getMonthOffset(monthNr) {
    return TimeProvider._getProviderInstance().getMonthOffset(monthNr)
  }

  /**
   * Calculates the day of the year for a given time, taking into account any day or hour delta specified.
   * 
   * @param {number} [dayDelta=0] - An optional number of days to add or subtract from the current date.
   * @param {number} [hourDelta=0] - An optional number of hours to add or subtract from the current time.
   * @returns {number} - The day of the year as an integer, with January 1st being 1 and December 31st being 365 (or 366 for a leap year).
   */
  static getDayOfYear(dayDelta = 0, hourDelta = 0) {
    return TimeProvider._getProviderInstance().getDayOfYear(dayDelta, hourDelta)
  }

  /**
   * This function calculates the current hour of the day for the given dayDelta and hourDelta parameters. If the
   * dayDelta parameter is positive, the function will return the current hour of the day after the specified
   * number of days have passed. If the dayDelta parameter is negative, the function will return the current hour
   * of the day before the specified number of days have passed. If the hourDelta parameter is positive, the function
   * will return the current hour of the day after the specified number of hours have passed. If the hourDelta
   * parameter is negative, the function will return the current hour of the day before the specified number of hours
   * have passed. The current hour of the day is calculated based on the current world time, which is obtained using
   * Fal.getWorldTime() function. If the current world time is negative, the function will return the current hour of
   * the day in reverse order (e.g., if the current hour of the day is 4 and the current world time is -14400 seconds,
   * the function will return 20).
   *   
   * @param {number} dayDelta - An optional parameter that represents the number of days to add or subtract from the current day.
   * @param {number} hourDelta - An optional parameter that represents the number of hours to add or subtract from the current hour.
   * @returns {number} The current hour of the day as an integer between 0 and 24, inclusive.
   *
   * @example
   * const timeProvider = new InternalTimeProvider()
   * // Returns the current hour of the day for the current day and hour
   * const currentHour = timeProvider.getHourOfDay()
   * // Returns the current hour of the day for the day 2 days from now and 5 hours from now
   * const futureHour = timeProvider.getHourOfDay(2, 5)
   * // Returns the current hour of the day for the day 3 days ago and 10 hours ago
   * const pastHour = timeProvider.getHourOfDay(-3, -10)
   */
  static getHourOfDay(dayDelta = 0, hourDelta = 0) {
    return TimeProvider._getProviderInstance().getHourOfDay(dayDelta, hourDelta)
  }

  /**
   * Calculates the current hour of the day as a percentage of noon (i.e., 50% = 12:00 PM).
   * This function normalizes the hour of the day to the range of 0-23 and calculates it as a percentage of noon,
   * where 12:00 PM is represented as 50%. The calculation is done using the sine function and returns a value
   * between 0-1.
   *
   * @param {number} [dayDelta=0] - The number of days to offset the calculation by.
   * @param {number} [hourDelta=0] - The number of hours to offset the calculation by.
   * @returns {number} The current hour of the day as a percentage of noon.
   *
   * @example
   * const timeProvider = new InternalTimeProvider()
   * // Get the current hour of the day as a percentage of noon
   * const hourOfDayNoonPct = timeProvider.hourOfDayNoonPct()
   * console.log(hourOfDayNoonPct) // e.g. 0.8264339470655381
   */
  static hourOfDayNoonPct(dayDelta = 0, hourDelta = 0) {
    return TimeProvider._getProviderInstance().hourOfDayNoonPct(dayDelta, hourDelta)
  }

  /**
   * Calculates the day of the year as a percentage of the summer solstice.
   * This function calculates the day of the year as a percentage of the summer solstice, which occurs around June 20th or 21st.
   * The result is useful for determining the season or other events in the game world that are tied to the progression of the year.
   * The dayDelta and hourDelta parameters can be used to offset the calculation by a certain number of days or hours.
   * By default, they are both set to 0, so the function will calculate the percentage for the current day and time.
   * The result is returned as a number between 0 and 1, where 0 represents the winter solstice and 1 represents the summer solstice.
   * The calculation is based on the number of days since the winter solstice, so the result will always be between 0 and 1.
   *
   * @param {number} [dayDelta=0] - Optional number of days to add to the current day of the year.
   * @param {number} [hourDelta=0] - Optional number of hours to add to the current hour of the day.
   * @returns {number} A number between 0 and 1 representing the percentage of the summer solstice day.
   */
  static dayOfYearSummerPct(dayDelta = 0, hourDelta = 0) {
    return TimeProvider._getProviderInstance().dayOfYearSummerPct(dayDelta, hourDelta)
  }

  /** 
   * Returns the localized string representation of the current scene time, dependant on the TimeProvider's
   * implementation and dependant modules.
   * 
   * @returns {string} The localized string representation of the current scene time, implementation dependant.
   * */
  static getI18nDateString() {
    const timeInfo = TimeProvider._getProviderInstance().getTimeStringData()
    // format timeInfo to localized string
    const compiledTemplate = Handlebars.compile(Fal.i18n('time.formatted'))
    const timeText = compiledTemplate(timeInfo)
    Logger.trace('TimeProvider.getI18nDateString', { 'TimeProvider._getProviderId()': TimeProvider._getProviderId(), 'timeInfo': timeInfo, 'timeText': timeText })
    return timeText
  }

  /**
   * Returns the unique timeHash of the current scene/game time modified by the optional offsett in days and
   * hours.
   * 
   * @param {number} [dayDelta=0] - Optional number of days to add to the current day of the year.
   * @param {number} [hourDelta=0] - Optional number of hours to add to the current hour of the day.
   * @returns {number} A unique number, representing the point in time over the course of a year. Used for cache keys.
   */
  static getCurrentTimeHash(dayOfYearOffset = 0, hourOfDayOffset = 0) {
    return TimeProvider.getTimeHash(TimeProvider.getDayOfYear() + dayOfYearOffset, TimeProvider.getHourOfDay() + hourOfDayOffset)
  }

  /**
   * Returns the unique timeHash of a given day and hour of the course of the year.
   * 
   * @param {number} [dayDelta=0] - Optional number of days to add to the current day of the year.
   * @param {number} [hourDelta=0] - Optional number of hours to add to the current hour of the day.
   * @returns {number} A unique number, representing the point in time over the course of a year. Used for cache keys.
   */
  static getTimeHash(dayOfYear, hourOfDay) {
    return (dayOfYear * TimeProvider.getHoursInDay()) + hourOfDay
  }

  /**
   * Returns the day of the year from a given timeHash.
   * 
   * @param {number} timeHash - the timeHash to be used to derive the day of the year from.
   * @returns - The day of the year, beginning at day 1.
   */
  static getDayOfYearFromTimeHash(timeHash) {
    return Math.trunc(timeHash / TimeProvider.getHoursInDay()) + 1
  }

  /**
   * Returns the month of the year from a given timeHash. Note that this returns 0 for the first
   * month to speed up calculations.
   * 
   * @param {number} timeHash - the timeHash to be used to derive the month of the year from.
   * @returns - The month of the year, beginning at month 0 for the first month.
   */
  static getMonthOfYearFromTimeHash(timeHash) {
    let dayOfYear = TimeProvider.getDayOfYearFromTimeHash(timeHash)
    for (let m = 0; m < TimeProvider.getNumberOfMonths(); m++) {
      if (dayOfYear < TimeProvider.getMonthOffset(m)) {
        return m
      }
    }
    return TimeProvider.getNumberOfMonths()
  }

  /**
   * Returns the day of the respective month from a given timeHash.
   * 
   * @param {number} timeHash - the timeHash to be used to derive the day of the month from.
   * @returns - The day of the month, beginning at day 1 for the first day in the month.
   */
  static getDayOfMonthFromTimeHash(timeHash) {
    let monthOfYear = TimeProvider.getMonthOfYearFromTimeHash(timeHash)
    return TimeProvider.getDayOfYearFromTimeHash(timeHash) - TimeProvider.getMonthOffset(monthOfYear - 1)
  }

  /**
  * Returns the hour of the day from a given timeHash. Note that this returns 0 for the first
  * hour to speed up calculations.
  * 
  * @param {number} timeHash - the timeHash to be used to derive the hour of the day from.
  * @returns - The hour of the day, beginning at month 0 for the first hour.
  */
  static getTimeOfDayFromTimeHash(timeHash) {
    return timeHash % TimeProvider.getHoursInDay()
  }

  /**
   * Retrieves the currently set time provider ID for the current scene.
   *
   * This function first calls Fal.getSceneFlag() to retrieve the value of the 'timeProvider' flag for the
   * current scene. If the flag is not set, this function returns undefined. If the flag is set, the value
   * is assigned to the providerId variable.
   *
   * If the providerId is set to 'simple-calendar' and the 'foundryvtt-simple-calendar' module is not enabled
   * or installed, this function logs a message and sets the 'timeProvider' flag to the internal provider.
   *
   * If the providerId is different from the _config property of the TimeProvider class, this function calls
   * the _initConfig() method of the TimeProvider class with the providerId value as an argument.
   * 
   * @returns {string|undefined} - The currently set time provider ID for the current scene, or undefined if the flag is not set.
   */
  static _getProviderId() {
    let providerId = Fal.getSceneFlag('timeProvider', TIME_PROVIDERS.INTERNAL)
    if (providerId == TIME_PROVIDERS.SIMPLE_CALENDAR && !Fal.isModuleEnabled('foundryvtt-simple-calendar')) {
      Logger.info('Module [simple-calendar] is not installed or disabled. Reverting time provider to internal for this scene.', true)
      Fal.setSceneFlag('timeProvider', TIME_PROVIDERS.INTERNAL)
      providerId = TIME_PROVIDERS.INTERNAL
    }
    // TODO check wether we have to recalculat? Potentially not as this is handled inside the providers.
    return providerId
  }

  /**
   * Returns a usable instance of the TimeProvider implementation set for the current scene settings. This also makes
   * sure that in case of a misconfiguration, the settings are reset and a usable instance is reterned anytime.
   * 
   * @returns {TimeProvider} - the implementation of the time provider as defined by configuration for the current scene.
   */
  static _getProviderInstance() {
    return TimeProvider._instances[TimeProvider._getProviderId()]
  }

}

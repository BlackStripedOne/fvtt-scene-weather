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

import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'

/**
 *  TODO
 */
export class TimeProvider {

  static config = {
    'daysInYear': 365,
    'summerSolstice': 172,
    'winterSolstice': 355,
    'monthOffset': [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],	// Days summed up for each previous months for faster calculation
    'hoursInDay': 24
  }

  static initConfig() {
    // TODO calculate depending on provider selected
  }

  static _getTimeProvider() {
    // may be 'small-time', 'simple-calendar' or 'manual'
    return 'simple-calendar'
  }

  /**
   * TODO
   */
  static getCurrentTimeHash() {
    return TimeProvider.getTimeHash(TimeProvider.getDayOfYear(), TimeProvider.getHourOfDay())
  }

  // Returns the unique hash for the time/day in year
  static getTimeHash(dayOfYear, hourOfDay) {
    let hash = (dayOfYear * TimeProvider.config.hoursInDay) + hourOfDay
    return hash
  }

  static getDayOfYearFromTimeHash(timeHash) {
    return Math.trunc(timeHash / TimeProvider.config.hoursInDay) + 1
  }

  static getMonthOfYearFromTimeHash(timeHash) {
    let dayOfYear = TimeProvider.getDayOfYearFromTimeHash(timeHash)
    for (let m = 0; m < TimeProvider.config.monthOffset.length; m++) {
      if (dayOfYear < TimeProvider.config.monthOffset[m]) {
        return m
      }
    }
    return TimeProvider.config.monthOffset.length
  }

  static getDayOfMonthFromTimeHash(timeHash) {
    let monthOfYear = TimeProvider.getMonthOfYearFromTimeHash(timeHash)
    return TimeProvider.getDayOfYearFromTimeHash(timeHash) - TimeProvider.config.monthOffset[monthOfYear - 1]
  }

  static getTimeOfDayFromTimeHash(timeHash) {
    return timeHash % TimeProvider.config.hoursInDay
  }

  static getDayOfYear() {
    if (game.modules.get('foundryvtt-simple-calendar')?.active && TimeProvider._getTimeProvider() === 'simple-calendar') {
      let scInstance = SimpleCalendar.api.timestampToDate(game.time.worldTime)
      //      Logger.debug('TimeProvider:getDayOfYear', {'sc':scInstance})
      return TimeProvider.config.monthOffset[scInstance.month] + scInstance.day
    } else {
      // Fallback to manual time
      let sceneManualDate = canvas.scene.getFlag(MODULE.ID, 'timeSeason')
      if (sceneManualDate === undefined) {
        sceneManualDate = Util.getSetting('timeSeason', 150)
      }
      return sceneManualData
    }
  }

  static getHourOfDay() {
    const currentWorldTime = game.time.worldTime + 0 // TODO Epoch Offsett
    const dayTime = Math.abs(Math.trunc((currentWorldTime % 86400) / 3600))
    if (currentWorldTime < 0) {
      return 24 - dayTime
    } else return dayTime
  }

}

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

  // Returns the unique hash for the time/day in year
  static getTimeHash(dayOfYear, hourOfDay) {
    let hash = (dayOfYear * TimeProvider.config.hoursInDay) + hourOfDay
    return hash
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

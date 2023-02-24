import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { TimeProvider } from './timeProvider.js'
import { Noise } from './noise.js'

/**
 *  RegionMeteo in combination with TimeOfDy/DayInYear will generate WeatherModel
 */
export class RegionMeteo {

  /**
   * Region Automatic lets you set RegionMeteo. uses TimeOfDy/DayInYear
   * 
   * @param {*} templateId 
   */
  constructor(templateId) {
    Logger.debug('RegionMeteo:constrctor', { 'templateId': templateId })
    if (templateId !== undefined) {
      // TOOD set parameters from template
      this.regionData = Utils.getApi().regionTemplates.find(template => template.id == templateId)
      if (this.regionData === undefined) {
        this.regionData = Utils.getApi().regionTemplates[0]
        canvas.scene.setFlag(MODULE.ID, 'regionTemplate', this.regionData.id)
        Logger.error('Unable to set region template with id [' + templateId + '] reverting to [' + this.regionData.id + ']. Maybe you removed a SceneWeather plugin after configuring your scene.', true)
      }
    } else {
      // TODO set parameters from scene config or if none found, from game defaults
      this.regionData = canvas.scene.getFlag(MODULE.ID, 'regionSettings')
    }
    // TODO use configurable seed
    this._noise = Noise.createNoise2D(0)
    this.updateConfig()
  }

  /**
  * TODO
  * 
  * @returns - array of dictionaries containing 'id' and 'name'
  */
  static getTemplates() {
    let res = []
    // TODO maybe use map?
    Utils.getApi().regionTemplates.forEach(template => {
      res.push({
        'id': template.id,
        'name': template.name
      })
    })
    return res
  }

  /**
   * Region Template sets specific RegionMeteo as well as given TimeOfDay/SeasonInYear
   * 
   * @param {*} templateId 
   * @returns 
   */
  static fromTemplate(templateId) {
    return new RegionMeteo(templateId) // from template
  }

  /**
   * TODO
   */
  updateConfig() {
    Logger.debug('RegionMeteo.updateConfig()')
    // update on potentially changed settings on the scene or default values
    // TODO

    // initialize cache
    this._cache = {}

    return true // TODO depending on wether there were changes. Maybe seed or other settings
  }

  /**
   * Calculate base values of the region based on date and time with optional offset
   * 
   * @param {*} dayDelta 
   * @param {*} hourDelta 
   * @returns 
   */
  getRegionBase(dayDelta = 0, hourDelta = 0) {
    if (dayDelta === undefined) dayDelta = 0
    if (hourDelta === undefined) hourDelta = 0

    // get current doy and hod
    let dayOfYear = TimeProvider.getDayOfYear()
    let hourOfDay = TimeProvider.getHourOfDay()

    // Align hour
    hourOfDay += hourDelta
    if (hourOfDay < 0) {
      while (hourOfDay < 0) {
        hourOfDay += 24
        dayOfYear--
      }
    }
    if (hourOfDay >= 24) {
      while (hourOfDay >= 24) {
        hourOfDay -= 24
        dayOfYear++
      }
    }

    // Align day
    dayOfYear += dayDelta
    if (dayOfYear < 0) {
      while (dayOfYear < 0) {
        dayOfYear += TimeProvider.config.daysInYear
      }
    }
    if (dayOfYear >= TimeProvider.config.daysInYear) {
      while (dayOfYear >= TimeProvider.config.daysInYear) {
        dayOfYear -= TimeProvider.config.daysInYear
      }
    }

    let timeHash = TimeProvider.getTimeHash(dayOfYear, hourOfDay)

    if (this._cache[timeHash] !== undefined) {
      return this._cache[timeHash]
    }

    // TODO implement cashing for calculated timeHash

    let baseValues = {
      'elevation': this.regionData.elevation,
      'vegetation': this.regionData.vegetation,   // TODO diminish from fall to early spring
      'waterAmount': this.regionData.waterAmount,  // TODO set to 0 for freezing temperatures
      'timeHash': timeHash
    }

    if (this.regionData.name === undefined) {
      baseValues.name = 'custom'
    } else {
      baseValues.name = this.regionData.name
    }

    let timeRelative = RegionMeteo._hodPct(hourOfDay) // 0.0 = midnight, 1.0 = noon
    let dateRelative = RegionMeteo._doyPct(dayOfYear) // 0.0 = winter solstice, 1.0 = summer solstice

    // calculate today's temperatures
    let todayTempDay = (this.regionData.summer.temperature.day - this.regionData.winter.temperature.day) * dateRelative + this.regionData.winter.temperature.day
    let todayTempNight = (this.regionData.summer.temperature.night - this.regionData.winter.temperature.night) * dateRelative + this.regionData.winter.temperature.night
    let todayTempVar = (this.regionData.summer.temperature.var - this.regionData.winter.temperature.var) * dateRelative + this.regionData.winter.temperature.var
    baseValues.baseTemp = this._getNoisedValue(timeHash + 1282, 64, (todayTempDay - todayTempNight) * timeRelative + todayTempNight, todayTempVar)

    // set waterAmount based on temperature
    if (baseValues.baseTemp < 0) baseValues.waterAmount = 0

    // calculate humidity
    let todayHumiDay = (this.regionData.summer.humidity.day - this.regionData.winter.humidity.day) * dateRelative + this.regionData.winter.humidity.day
    let todayHumiNight = (this.regionData.summer.humidity.night - this.regionData.winter.humidity.night) * dateRelative + this.regionData.winter.humidity.night
    let todayHumiVar = (this.regionData.summer.humidity.var - this.regionData.winter.humidity.var) * dateRelative + this.regionData.winter.humidity.var
    baseValues.baseHumidity = Utils.clamp(this._getNoisedValue(timeHash + 732, 64, (todayHumiDay - todayHumiNight) * timeRelative + todayHumiNight, todayHumiVar), 0, 100)

    // calculate sun amount TODO better calculation needed
    let todaySunHoursHlf = ((this.regionData.summer.sun.hours - this.regionData.winter.sun.hours) * dateRelative + this.regionData.winter.sun.hours) / 2
    let noonDeltaHrs = Math.abs(12 - hourOfDay)
    if (noonDeltaHrs > (todaySunHoursHlf)) {
      // already after sunset or before sunrise
      baseValues.sunAmount = 0
    } else {
      baseValues.sunAmount = Utils.clamp((1 - (1 / (todaySunHoursHlf / noonDeltaHrs))) * (todaySunHoursHlf / 3), 0, 1)
    }

    // calculate wind
    let todayWindAvg = (this.regionData.summer.wind.avg - this.regionData.winter.wind.avg) * dateRelative + this.regionData.winter.wind.avg
    let todayWindVar = (this.regionData.summer.wind.var - this.regionData.winter.wind.var) * dateRelative + this.regionData.winter.wind.var
    let factor = 1
    if (baseValues.sunAmount < 0.1) {
      factor = 0.9
    } else if (baseValues.sunAmount < 0.2) {
      // Sunrise or Sunset condition
      if (hourOfDay > 12) {
        // Less wind on sunset
        factor = 0.8
      } else {
        // More wind on sunrise
        factor = 1.2
      }
    } else {
      factor = 1.1
    }
    baseValues.wind = Utils.clamp(this._getNoisedValue(timeHash + 978, 16, factor * todayWindAvg, todayWindVar), 0, 80) // Maximum 80 m/s wind. Maybe overthink this.
    baseValues.gusts = Utils.clamp(baseValues.wind + this._getNoisedValue(timeHash + 12, 8, factor * todayWindVar, todayWindVar), 0, 80)

    this._cache[timeHash] = baseValues
    return baseValues
  }

  /**
   * TODO
   * 
   * @param {*} timeHash 
   * @param {*} mainAmpli 
   * @param {*} baseValue 
   * @param {*} variation 
   * @returns 
   * 
   * @protected
   */
  _getNoisedValue(timeHash, mainAmpli, baseValue, variation) {
    timeHash = timeHash / mainAmpli
    let e = 1 * this._noise(1 * timeHash, 1 * timeHash) +
      0.5 * this._noise(2 * timeHash, 2 * timeHash) +
      0.25 * this._noise(4 * timeHash, 4 * timeHash)
    let n = e / (1 + 0.5 + 0.25)
    return baseValue + ((variation * n * 2) - variation)
  }

  /**
     * Hour on days as percentile
     * 
     * @param {*} hourOfDay 
     * @returns 
     * 
     * @private
     */
  static _hodPct(hourOfDay) {
    // Normalize hour value to the range [0, 24)
    hourOfDay = hourOfDay % 24;
    return (Math.sin(((hourOfDay / 12) - 0.5) * (Math.PI)) + 1) / 2	// TODO may use sinetable for speed
  }

  /**
   * Day of year as percentile
   * 
   * @param {*} dayOfYear 
   * @returns {number} - [0,1]
   * 
   * @private
   */
  static _doyPct(dayOfYear) {
    // Summer solstice is around June 20th or 21st
    const summerSolstice = TimeProvider.config.summerSolstice % TimeProvider.config.daysInYear
    // Winter solstice is around December 21st or 22nd
    const winterSolstice = TimeProvider.config.winterSolstice % TimeProvider.config.daysInYear
    let wSb = winterSolstice
    let wSa = winterSolstice
    if (winterSolstice < summerSolstice) {
      // winter solstice is at the beginning of the year
      wSa = winterSolstice + TimeProvider.config.daysInYear
    } else {
      // winter solstice is at the end of the year
      wSb = winterSolstice - TimeProvider.config.daysInYear // may be negative
    }
    if (dayOfYear > wSa) dayOfYear -= TimeProvider.config.daysInYear
    let pct
    if (dayOfYear == summerSolstice) {
      pct = 1
    } else if (dayOfYear < summerSolstice) {
      pct = (dayOfYear - wSb) / (summerSolstice - wSb)
    } else {
      pct = 1 - ((dayOfYear - summerSolstice) / (wSa - summerSolstice))
    }
    return pct // TODO use sine
  }

}

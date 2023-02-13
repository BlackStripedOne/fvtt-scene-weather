import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { TimeProvider } from './timeProvider.js'
import { Noise } from './noise.js'

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
          'day': 27,
          "night": 22,
          "var": 3
        },
        "humidity": {
          "day": 80,
          "night": 50,
          "var": 10
        },
        "wind": {
          "avg": 5,
          "var": 5
        },
        "sun": {
          "hours": 8
        }
      },
      'winter': {
        'temperature': {
          'day': 15,
          "night": 2,
          "var": 5
        },
        "humidity": {
          "day": 60,
          "night": 30,
          "var": 10
        },
        "wind": {
          "avg": 10,
          "var": 8
        },
        "sun": {
          "hours": 2
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
    this._noise = Noise.createNoise2D(0)
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
  update() {
    // update on potentially changed settings on the scene or default values
    // TODO
    // TODO invalidate cache
  }

  /**
   * Day of year as percentile
   */
  _doyPct(dayOfYear) {
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

  /**
   * Hour on days as percentile
   */
  _hodPct(hourOfDay) {
    // Normalize hour value to the range [0, 24)
    hourOfDay = hourOfDay % 24;
    return (Math.sin(((hourOfDay / 12) - 0.5) * (Math.PI)) + 1) / 2	// TODO may use sinetable for speed
  }

  _getNoisedValue(timeHash, mainAmpli, baseValue, variation) {
    timeHash = timeHash / mainAmpli
    let e = 1 * this._noise(1 * timeHash, 1 * timeHash) +
      0.5 * this._noise(2 * timeHash, 2 * timeHash) +
      0.25 * this._noise(4 * timeHash, 4 * timeHash)
    let n = e / (1 + 0.5 + 0.25)
    return baseValue + ((variation * n * 2) - variation)
  }

  
  // Calculate base values of the region based on date and time with optional offset
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

    // TODO implement cashing for calculated timeHash

    let baseValues = {
      'elevation': this.regionData.elevation,
      'vegetation': this.regionData.vegetation,   // TODO diminish from fall to early spring
      'waterAmount': this.regionData.waterAmount,  // TODO set to 0 for freezing temperatures
      'timeHash': timeHash
    }

    let timeRelative = this._hodPct(hourOfDay) // 0.0 = midnight, 1.0 = noon
    let dateRelative = this._doyPct(dayOfYear) // 0.0 = winter solstice, 1.0 = summer solstice

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

    Logger.debug('RegionMeteo.getRegionBase', { 'DoY': dayOfYear, 'HoD': hourOfDay, 'values': baseValues })
    return baseValues
  }


}

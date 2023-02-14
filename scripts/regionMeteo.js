import { MODULE } from './constants.js'
import { Logger, Utils } from './utils.js'
import { TimeProvider } from './timeProvider.js'
import { Noise } from './noise.js'

/**
 *  RegionMeteo in combination with TimeOfDy/DayInYear will generate WeatherModel
 */
export class RegionMeteo {

  static templates = {
    'rainforest': {
      'name': 'Tropical Rainforest',
      'description': 'Dense forest with high amounts of rainfall and high biodiversity.', // Regenwald: Dichter Wald mit hohen Niederschlagsmengen und hoher Artenvielfalt.
      'elevation': 200,
      'vegetation': 100,
      'waterAmount': 80,
      'summer': {
        'temperature': {
          'day': 32.5,
          "night": 22.5,
          "var": 5
        },
        'humidity': {
          'day': 90,
          'night': 80,
          'var': 10
        },
        'wind': {
          'avg': 5,
          'var': 5
        },
        'sun': {
          'hours': 12
        }
      },
      'winter': {
        'temperature': {
          'day': 32.5,
          "night": 22.5,
          "var": 5
        },
        'humidity': {
          'day': 80,
          'night': 70,
          'var': 10
        },
        'wind': {
          'avg': 5,
          'var': 5
        },
        'sun': {
          'hours': 12
        }
      }
    },
    'desert': {
      'name': 'Desert',
      'description': 'Dry region with little rainfall and high temperatures during the day, but can be cold at night.', // Wüste: Trockene Region mit wenig Niederschlag und hohen Temperaturen am Tag, kann aber nachts kalt sein.
      'elevation': 500,
      'vegetation': 0,
      'waterAmount': 0,
      'summer': {
        'temperature': {
          'day': 45,
          "night": 25,
          "var": 10
        },
        'humidity': {
          'day': 10,
          'night': 20,
          'var': 5
        },
        'wind': {
          'avg': 30,
          'var': 10
        },
        'sun': {
          'hours': 13
        }
      },
      'winter': {
        'temperature': {
          'day': 25,
          'night': 5,
          "var": 10
        },
        'humidity': {
          'day': 30,
          'night': 50,
          'var': 20
        },
        'wind': {
          'avg': 25,
          'var': 10
        },
        'sun': {
          'hours': 11
        }
      }
    },
    'grassland': {
      'name': 'Grassland',
      'description': 'Open, flat region dominated by grasses and characterized by seasonal rainfall.', // Grasland: Offene, flache Region, die von Gräsern dominiert wird und durch saisonale Niederschläge gekennzeichnet ist.
      'elevation': 200,
      'vegetation': 40,
      'waterAmount': 20,
      'summer': {
        'temperature': {
          'day': 30,
          "night": 15,
          "var": 10
        },
        'humidity': {
          'day': 70,
          'night': 80,
          'var': 5
        },
        'wind': {
          'avg': 10,
          'var': 10
        },
        'sun': {
          'hours': 14
        }
      },
      'winter': {
        'temperature': {
          'day': 10,
          "night": -5,
          "var": 10
        },
        'humidity': {
          'day': 70,
          'night': 60,
          'var': 10
        },
        'wind': {
          'avg': 10,
          'var': 10
        },
        'sun': {
          'hours': 10
        }
      }
    },
    'temperate': {
      'name': 'Temperate Forest',
      'description': 'TODO',
      'elevation': 400,
      'vegetation': 50,
      'waterAmount': 10,
      'summer': {
        'temperature': {
          'day': 25,
          "night": 15,
          "var": 10
        },
        'humidity': {
          'day': 70,
          'night': 60,
          'var': 10
        },
        'wind': {
          'avg': 15,
          'var': 10
        },
        'sun': {
          'hours': 15
        }
      },
      'winter': {
        'temperature': {
          'day': 10,
          "night": 0,
          "var": 10
        },
        'humidity': {
          'day': 60,
          'night': 65,
          'var': 5
        },
        'wind': {
          'avg': 20,
          'var': 10
        },
        'sun': {
          'hours': 9
        }
      }
    },
    'taiga': {
      'name': 'Boreal Forest',
      'description': 'Dense forest of coniferous trees found in colder regions with long winters.',  // Dichter Wald aus Nadelbäumen, der in kälteren Regionen mit langen Wintern zu finden ist.
      'elevation': 400,
      'vegetation': 70,
      'waterAmount': 10,
      'summer': {
        'temperature': {
          'day': 20,
          "night": 10,
          "var": 10
        },
        'humidity': {
          'day': 70,
          'night': 80,
          'var': 5
        },
        'wind': {
          'avg': 15,
          'var': 10
        },
        'sun': {
          'hours': 17
        }
      },
      'winter': {
        'temperature': {
          'day': -5,
          "night": -25,
          "var": 10
        },
        'humidity': {
          'day': 80,
          'night': 60,
          'var': 5
        },
        'wind': {
          'avg': 25,
          'var': 10
        },
        'sun': {
          'hours': 8
        }
      }
    },
    'tundra': {
      'name': 'Tundra',
      'description': 'Cold, treeless region with permafrost and a short growing season.', // Tundra: Kalte, baumlose Region mit Permafrost und einer kurzen Vegetationsperiode.
      'elevation': 300,
      'vegetation': 1,
      'waterAmount': 5,
      'summer': {
        'temperature': {
          'day': 7.5,
          "night": 2.5,
          "var": 5
        },
        'humidity': {
          'day': 60,
          'night': 50,
          'var': 10
        },
        'wind': {
          'avg': 20,
          'var': 10
        },
        'sun': {
          'hours': 18
        }
      },
      'winter': {
        'temperature': {
          'day': -15,
          "night": -25,
          "var": 10
        },
        'humidity': {
          'day': 70,
          'night': 50,
          'var': 5
        },
        'wind': {
          'avg': 25,
          'var': 10
        },
        'sun': {
          'hours': 6
        }
      }
    },
    'mediterranean': {
      'name': 'Mediterranean',
      'description': 'Region with mild, rainy winters and hot, dry summers, known for its characteristic vegetation.', // Mediterran: Region mit milden, regnerischen Wintern und heißen, trockenen Sommern, bekannt für ihre charakteristische Vegetation.
      'elevation': 500,
      'vegetation': 50,
      'waterAmount': 20,
      'summer': {
        'temperature': {
          'day': 30,
          "night": 17.5,
          "var": 7.5
        },
        'humidity': {
          'day': 60,
          'night': 65,
          'var': 5
        },
        'wind': {
          'avg': 15,
          'var': 10
        },
        'sun': {
          'hours': 15
        }
      },
      'winter': {
        'temperature': {
          'day': 17.5,
          "night": 7.5,
          "var": 5
        },
        'humidity': {
          'day': 70,
          'night': 60,
          'var': 10
        },
        'wind': {
          'avg': 20,
          'var': 10
        },
        'sun': {
          'hours': 9
        }
      }
    },
    'savanna': {
      'name': 'Savanna',
      'description': 'Open grassland region with scattered trees and distinct dry and wet seasons.', // Savanne: Offene Graslandregion mit vereinzelten Bäumen und ausgeprägten Trocken- und Regenzeiten.
      'elevation': 300,
      'vegetation': 30,
      'waterAmount': 5,
      'summer': {
        'temperature': {
          'day': 32.5,
          "night": 22.5,
          "var": 5
        },
        'humidity': {
          'day': 60,
          'night': 70,
          'var': 10
        },
        'wind': {
          'avg': 20,
          'var': 10
        },
        'sun': {
          'hours': 13
        }
      },
      'winter': {
        'temperature': {
          'day': 27.5,
          "night": 17.5,
          "var": 5
        },
        'humidity': {
          'day': 40,
          'night': 30,
          'var': 10
        },
        'wind': {
          'avg': 20,
          'var': 10
        },
        'sun': {
          'hours': 11
        }
      }
    },
    'alpine': {
      'name': 'Alpine',
      'description': 'High-altitude region with low temperatures and often covered in snow and ice.', // Hochgebirgsregion mit niedrigen Temperaturen und oft von Schnee und Eis bedeckt.
      'elevation': 1000,
      'vegetation': 0,
      'waterAmount': 0,
      'summer': {
        'temperature': {
          'day': 15,
          "night": 5,
          "var": 7.5
        },
        'humidity': {
          'day': 50,
          'night': 60,
          'var': 5
        },
        'wind': {
          'avg': 30,
          'var': 10
        },
        'sun': {
          'hours': 14
        }
      },
      'winter': {
        'temperature': {
          'day': 0,
          "night": -15,
          "var": 7.5
        },
        'humidity': {
          'day': 70,
          'night': 60,
          'var': 5
        },
        'wind': {
          'avg': 40,
          'var': 20
        },
        'sun': {
          'hours': 10
        }
      }
    },
    'coastal': {
      'name': 'Coastal',
      'description': 'Region influenced by the ocean with relatively mild temperatures and often high humidity.', // Küstengebiet: Region, die vom Ozean beeinflusst wird, mit vergleichsweise milden Temperaturen und oft hoher Luftfeuchtigkeit.
      'elevation': 100,
      'vegetation': 20,
      'waterAmount': 70,
      'summer': {
        'temperature': {
          'day': 25,
          "night": 15,
          "var": 10
        },
        'humidity': {
          'day': 80,
          'night': 75,
          'var': 15
        },
        'wind': {
          'avg': 10,
          'var': 25
        },
        'sun': {
          'hours': 14
        }
      },
      'winter': {
        'temperature': {
          'day': 15,
          "night": 5,
          "var": 10
        },
        'humidity': {
          'day': 75,
          'night': 70,
          'var': 5
        },
        'wind': {
          'avg': 20,
          'var': 25
        },
        'sun': {
          'hours': 10
        }
      }
    },
    'polar': {  // https://en.wikipedia.org/wiki/Polar_climate
      'name': 'Polar',
      'description': 'Regions with permanently frozen water and very low temperatures.', // Polare Eiskappen: Regionen mit dauerhaft gefrorenem Wasser und sehr niedrigen Temperaturen.
      'elevation': 0,
      'vegetation': 0,
      'waterAmount': 30,
      'summer': {
        'temperature': {
          'day': 2.5,
          "night": -2.5,
          "var": 5
        },
        'humidity': {
          'day': 80,
          'night': 65,
          'var': 10
        },
        'wind': {
          'avg': 35,
          'var': 20
        },
        'sun': {
          'hours': 23
        }
      },
      'winter': {
        'temperature': {
          'day': -15,
          "night": -25,
          "var": 10
        },
        'humidity': {
          'day': 90,
          'night': 70,
          'var': 5
        },
        'wind': {
          'avg': 40,
          'var': 20
        },
        'sun': {
          'hours': 1
        }
      }
    },
    'chaparral': { // https://en.wikipedia.org/wiki/Chaparral
      'name': 'Chaparral',
      'description': 'Dry, shrubland region with hot summers and mild, rainy winters.', // Trockene, strauchige Region mit heißen Sommern und milden, regnerischen Wintern.
      'elevation': 1000,
      'vegetation': 5,
      'waterAmount': 5,
      'summer': {
        'temperature': {
          'day': 32.5,
          "night": 17.5,
          "var": 5
        },
        'humidity': {
          'day': 60,
          'night': 40,
          'var': 5
        },
        'wind': {
          'avg': 25,
          'var': 10
        },
        'sun': {
          'hours': 13
        }
      },
      'winter': {
        'temperature': {
          'day': 17.5,
          "night": 2.5,
          "var": 5
        },
        'humidity': {
          'day': 60,
          'night': 50,
          'var': 5
        },
        'wind': {
          'avg': 30,
          'var': 10
        },
        'sun': {
          'hours': 11
        }
      }
    },
    'steppe': { // https://de.wikipedia.org/wiki/Steppe
      'name': 'Steppe',
      'description': 'Large, flat region with low rainfall and characteristic grasses.', // Steppe: Große, flache Region mit geringem Niederschlag und charakteristischen Gräsern.
      'elevation': 500,
      'vegetation': 5,
      'waterAmount': 0,
      'summer': {
        'temperature': {
          'day': 27.5,
          "night": 15,
          "var": 5
        },
        'humidity': {
          'day': 30,
          'night': 25,
          'var': 5
        },
        'wind': {
          'avg': 25,
          'var': 10
        },
        'sun': {
          'hours': 14
        }
      },
      'winter': {
        'temperature': {
          'day': 5,
          "night": -5,
          "var": 10
        },
        'humidity': {
          'day': 40,
          'night': 30,
          'var': 10
        },
        'wind': {
          'avg': 20,
          'var': 10
        },
        'sun': {
          'hours': 10
        }
      }
    },
    'wetland': {
      'name': 'Wetland',
      'description': 'Area with high water saturation, often with distinctive vegetation.', // Feuchtgebiete: Gebiet mit hoher Wassersättigung, oft mit charakteristischer Vegetation.
      'elevation': 100,
      'vegetation': 60,
      'waterAmount': 80,
      'summer': {
        'temperature': {
          'day': 25,
          "night": 15,
          "var": 10
        },
        'humidity': {
          'day': 70,
          'night': 80,
          'var': 10
        },
        'wind': {
          'avg': 15,
          'var': 10
        },
        'sun': {
          'hours': 16
        }
      },
      'winter': {
        'temperature': {
          'day': 5,
          "night": -5,
          "var": 10
        },
        'humidity': {
          'day': 60,
          'night': 60,
          'var': 5
        },
        'wind': {
          'avg': 20,
          'var': 5
        },
        'sun': {
          'hours': 8
        }
      }
    },
    'mangrove': {  // https://en.wikipedia.org/wiki/Mangrove
      'name': 'Mangrove',
      'description': 'Coastal wetland region characterized by trees and shrubs adapted to saltwater and often submerged in water.', // Mangroven: Küstennassegebiete, die von Bäumen und Sträuchern angepasst an Salzwasser und oft von Wasser bedeckt sind, gekennzeichnet sind.
      'elevation': 0,
      'vegetation': 80,
      'waterAmount': 60,
      'summer': {
        'temperature': {
          'day': 32.5,
          "night": 22.5,
          "var": 5
        },
        'humidity': {
          'day': 60,
          'night': 70,
          'var': 10
        },
        'wind': {
          'avg': 10,
          'var': 5
        },
        'sun': {
          'hours': 16
        }
      },
      'winter': {
        'temperature': {
          'day': 27.5,
          "night": 17.5,
          "var": 5
        },
        'humidity': {
          'day': 60,
          'night': 60,
          'var': 10
        },
        'wind': {
          'avg': 15,
          'var': 10
        },
        'sun': {
          'hours': 8
        }
      }
    },
    'littoral': { // https://en.wikipedia.org/wiki/Littoral_zone
      'name': 'Littoral',
      'description': 'The region where the land meets the water in a lake, river, or ocean, with unique plants and animals adapted to this interface.', // Litoralzone: Die Region, in der das Land in einem See, Fluss oder Ozean auf das Wasser trifft, mit einzigartigen Pflanzen und Tieren, die an diese Schnittstelle angepasst sind.
      'elevation': 0,
      'vegetation': 1,
      'waterAmount': 50,
      'summer': {
        'temperature': {
          'day': 25,
          "night": 15,
          "var": 10
        },
        'humidity': {
          'day': 60,
          'night': 60,
          'var': 5
        },
        'wind': {
          'avg': 10,
          'var': 5
        },
        'sun': {
          'hours': 16
        }
      },
      'winter': {
        'temperature': {
          'day': 15,
          "night": 5,
          "var": 10
        },
        'humidity': {
          'day': 60,
          'night': 60,
          'var': 10
        },
        'wind': {
          'avg': 15,
          'var': 10
        },
        'sun': {
          'hours': 8
        }
      }
    }
  }


  /**
   * Region Automatic lets you set RegionMeteo. uses TimeOfDy/DayInYear
   * 
   * @param {*} templateId 
   */
  constructor(templateId) {
    Logger.debug('RegionMeteo:constrctor', { 'templateId': templateId })
    if (templateId !== undefined) {
      // TOOD set parameters from template
      this.regionData = RegionMeteo.templates[templateId]
    } else {
      // TODO set parameters from scene config or if none found, from game defaults
      this.regionData = canvas.scene.getFlag(MODULE.ID, 'regionSettings')
    }
    // TODO use configurable seed
    this._noise = Noise.createNoise2D(0)
    this.update()
  }

  /**
  * TODO
  * 
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
  update() {
    // update on potentially changed settings on the scene or default values
    // TODO

    // initialize cache
    this._cache = {}
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

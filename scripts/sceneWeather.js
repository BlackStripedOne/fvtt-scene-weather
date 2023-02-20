import { Logger, Utils } from './utils.js'

/*
 Input:
 - WeatherModel
 - Config(custom)

 Internal State:
   - "playlist"
    - "weather particle effect"
    - "weather overlay effect"
    - "temperature"
      - "air"
      - "ground"
      - "perceived"
    - "moisture"
    - "wind"
      - "speed"
      - "direction"
      - "gusts"
    - "sun"
      - "intensity"
    - "clouds"
      - "coverage"
      - "tops"
      - "bottoms"
      - "types"
    - "precipitation"
      - "amount"
      - "type"
 */
export class SceneWeather {

  /**
   * TODO
   * @param {*} weatherModel 
   */
  constructor(weatherModel) {
    this.weatherModel = weatherModel
    Logger.debug('SceneWeather:constrctor', { 'weatherModel': weatherModel })
  }

  /**
   * TODO
   */
  update() {
    this.weatherModel.update()
  }

  /**
   * TODO invoke via layer menu buttons -> see there
   */
  async applyFxToScene() {

  }

  // disableFxOnScene()

  // updateFxOnScene()



  static _getPercievedTempId(temperature) {
    if (temperature < -7) {
      return 'meteo.freezing'
    } else if (temperature < -3) {
      return 'meteo.cold'
    } else if (temperature < 3) {
      return 'meteo.chill'
    } else if (temperature < 7) {
      return 'meteo.fresh'
    } else if (temperature < 18) {
      return 'meteo.moderate'
    } else if (temperature < 22) {
      return 'meteo.mild'
    } else if (temperature < 30) {
      return 'meteo.warm'
    } else if (temperature < 37) {
      return 'meteo.hot'
    } else {
      return 'meteo.searing'
    }
  }

  static _getWindDirId(direction) {
    let val = Math.floor((direction / 22.5) + 0.5)
    const arr = ["n", "nne", "ne", "ene", "e", "ese", "se", "sse", "s", "ssw", "sw", "wsw", "w", "wnw", "nw", "nnw"]
    return "meteo." + arr[(val % 16)]
  }

  static _getCloudHightId(height) {
    if (height < 600) {
      return 'meteo.low'
    } else if (height < 1000) {
      return 'meteo.mid'
    } else if (height < 4000) {
      return 'meteo.high'
    } else {
      return 'meteo.veryhigh'
    }
  }

  static _getCloudAmountId(amount) {
    const octas = [
      'meteo.skc', // Sky Clear
      'meteo.few', // Few Clouds
      'meteo.few', // Few Clouds
      'meteo.sct', // Scattered Clouds
      'meteo.sct', // Scattered Clouds
      'meteo.bkn', // Broken Couds
      'meteo.bkn', // Broken Clouds
      'meteo.bkn', // Broken Clouds
      'meteo.ovc'  // Overcast
    ]
    return octas[Math.round(amount * 8)]
  }

  static _getCloudTypeId(type) {
    switch (type) {
      case 0:
        return 'meteo.none'
      case 1:
        return 'meteo.fog'
      case 2:
        return 'meteo.stratus'
      case 3:
        return 'meteo.cumulus'
      case 4:
      default:
        return 'meteo.cumulunimbus'
    }
  }

  static _getHumidityId(humidity) {
    if (humidity < 20) {
      return 'meteo.dry'
    } else if (humidity < 40) {
      return 'meteo.comfortable'
    } else if (humidity < 50) {
      return 'meteo.pleasant'
    } else if (humidity < 65) {
      return 'meteo.sticky'
    } else if (humidity < 75) {
      return 'meteo.humid'
    } else {
      return 'meteo.oppressive'
    }
  }

  static _getSunAmountId(amount) {
    if (amount < 0.10) {
      return 'meteo.gloomy'
    } else if (amount < 0.3) {
      return 'meteo.shaded'
    } else if (amount < 0.7) {
      return 'meteo.normal'
    } else {
      return 'meteo.bright'
    }
  }

  static _getPrecipitationAmountId(amount) {
    if (amount < 0.20) {
      return 'meteo.nothing'
    } else if (amount < 0.40) {
      return 'meteo.slight'
    } else if (amount < 0.70) {
      return 'meteo.average'
    } else if (amount < 0.95) {
      return 'meteo.heavy'
    } else {
      return 'meteo.extreme'
    }
  }

  static _getPrecipitationTypeId(type) {
    switch (type) {
      case 0:
      default:
        return 'meteo.none'
      case 1:
        return 'meteo.drizzle'
      case 2:
        return 'meteo.rain'
      case 3:
        return 'meteo.downpour'
      case 4:
        return 'meteo.hail'
      case 5:
        return 'meteo.snow'
      case 6:
        return 'meteo.blizzard'
    }
  }

  // https://education.nationalgeographic.org/resource/beaufort-scale/
  static _getWindSpeedId(wind) {
    let gusting = ''
    if (wind.gusts > 5) {
      gusting = 'Gusting'
    }
    if (wind.speed < 1) {
      return 'meteo.calm' + gusting  // Calm and Still
    } else if (wind.speed < 5) {
      return 'meteo.light' + gusting // Light Wind
    } else if (wind.speed < 11) {
      return 'meteo.lightBreeze' + gusting // Light breeze
    } else if (wind.speed < 28) {
      return 'meteo.gentleBreeze' + gusting // Gentle breeze
    } else if (wind.speed < 38) {
      return 'meteo.freshBreeze' + gusting // Fresh Breeze
    } else if (wind.speed < 49) {
      return 'meteo.strongBreeze' + gusting // Strong breeze
    } else if (wind.speed < 61) {
      return 'meteo.moderateGale' + gusting // Moderate Gale
    } else if (wind.speed < 74) {
      return 'meteo.freshGale' + gusting // Fresh gale
    } else if (wind.speed < 88) {
      return 'meteo.strongGale' + gusting // Strong gale
    } else if (wind.speed < 102) {
      return 'meteo.wholeGale' + gusting // WHole Gale
    } else if (wind.speed < 118) {
      return 'meteo.storm' + gusting // Storm
    } else {
      return 'meteo.hurricane' + gusting // Hurricane
    }
  }

  // Return localized string of weather info
  getPerceptiveWeatherI18n(dayOffset = 0, hourOffset = 0) {
    const meteoData = this.getWeatherInfo(dayOffset, hourOffset)
    const compiledTemplate = Handlebars.compile(Utils.i18n('meteo.perceptive'))
    const weatherInfoHtml = compiledTemplate(meteoData)
    return weatherInfoHtml
  }

  getWeatherInfo(dayOffset = 0, hourOffset = 0) {
    let modelData = this.weatherModel.getWeatherData(dayOffset, hourOffset)
    let weatherInfo = {
      'name': modelData.name,
      'temperature': {
        'air': Math.round(modelData.temp.air),
        'ground': Math.round(modelData.temp.ground),
        'percieved': Math.round(modelData.temp.percieved),
        'percievedId': SceneWeather._getPercievedTempId(modelData.temp.percieved)
      },
      'humidity': {
        'percent': Math.round(modelData.humidity),
        'percentId': SceneWeather._getHumidityId(modelData.humidity)
      },
      'wind': {
        'speed': Math.round(modelData.wind.speed),
        'gusts': Math.round(modelData.wind.gusts),
        'speedId': SceneWeather._getWindSpeedId(modelData.wind),
        'direction': Math.round(modelData.wind.direction),
        'directionId': SceneWeather._getWindDirId(modelData.wind.direction)
      },
      'clouds': {
        'height': Math.round(modelData.clouds.bottom),
        'heightId': SceneWeather._getCloudHightId(modelData.clouds.bottom),
        'amount': Math.round(modelData.clouds.coverage * 100),
        'amountId': SceneWeather._getCloudAmountId(modelData.clouds.coverage),
        'type': SceneWeather._getCloudTypeId(modelData.clouds.type)
      },
      'sun': {
        'amount': Math.round(modelData.sun.amount * 100),
        'amountId': SceneWeather._getSunAmountId(modelData.sun.amount)
      },
      'precipitation': {
        'amount': Math.round(modelData.precipitation.amount * 100),
        'amountId': SceneWeather._getPrecipitationAmountId(modelData.precipitation.amount),
        'type': SceneWeather._getPrecipitationTypeId(modelData.precipitation.type)
      }
    }
    return weatherInfo
  }

  /**
   * TODO
   */
  getSceneWeatherFx() {
    let modelData = this.weatherModel.getWeatherData()
    let emitterConfigs = []
    Logger.debug('SceneWeather.getSceneWeatherFx()', { 'model': modelData, 'gen': game.sceneWeather.generators })
    game.sceneWeather.generators.forEach(generator => {
      Logger.debug('getSceneWeatherFx for generator', { 'generator': generator })
      let config = generator.getEmitter(modelData)
      if (config != null) {
        emitterConfigs.push(config)
      }
    })
    return emitterConfigs
  }


  /**
 * Convert temperature in fahrenheit to celsius.
 *
 * @param Tf temperature in fahrenheit
 * @returns {number}
 */
  fahrenheitToCelsius(Tf) {
    return (Tf - 32) / 1.8;
  }

  /**
   * Convert temperature in celsius to fahrenheit.
   *
   * @param Tc temperature in celsius
   * @returns {number}
   */
  celsiusToFahrenheit(Tc) {
    return (Tc * 1.8) + 32;
  }

}

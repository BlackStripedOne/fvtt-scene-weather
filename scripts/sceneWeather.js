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
      return 'freezing'
    } else if (temperature < -3) {
      return 'cold'
    } else if (temperature < 3) {
      return 'chill'
    } else if (temperature < 7) {
      return 'fresh'
    } else if (temperature < 18) {
      return 'moderate'
    } else if (temperature < 22) {
      return 'mild'
    } else if (temperature < 30) {
      return 'warm'
    } else if (temperature < 37) {
      return 'hot'
    } else {
      return 'searing'
    }
  }

  static _getWindDirId(direction) {
    let val = Math.floor((direction / 22.5) + 0.5)
    const arr = ["n", "nne", "ne", "ene", "e", "ese", "se", "sse", "s", "ssw", "sw", "wsw", "w", "wnw", "nw", "nnw"]
    return arr[(val % 16)]
  }

  static _getCloudHightId(height) {
    if (height < 600) {
      return 'low'
    } else if (height < 1000) {
      return 'mid'
    } else if (height < 4000) {
      return 'high'
    } else {
      return 'veryhigh'
    }
  }

  static _getCloudAmountId(amount) {
    const octas = [
      'skc', // Sky Clear
      'few', // Few Clouds
      'few', // Few Clouds
      'sct', // Scattered Clouds
      'sct', // Scattered Clouds
      'bkn', // Broken Couds
      'bkn', // Broken Clouds
      'bkn', // Broken Clouds
      'ovc'  // Overcast
    ]
    return octas[Math.round(amount * 8)]
  }

  static _getCloudTypeId(type) {
    switch (type) {
      case 0:
        return 'none'
      case 1:
        return 'fog'
      case 2:
        return 'stratus'
      case 3:
        return 'cumulus'
      case 4:
      default:
        return 'cumulunimbus'
    }
  }

  static _getHumidityId(humidity) {
    if (humidity < 20) {
      return 'dry'
    } else if (humidity < 40) {
      return 'comfortable'
    } else if (humidity < 50) {
      return 'pleasant'
    } else if (humidity < 65) {
      return 'sticky'
    } else if (humidity < 75) {
      return 'humid'
    } else {
      return 'oppressive'
    }
  }

  static _getSunAmountId(amount) {
    if (amount < 0.30) {
      return 'gloomy'
    } else if (amount < 0.60) {
      return 'shaded'
    } else if (amount < 0.90) {
      return 'normal'
    } else {
      return 'bright'
    }
  }

  static _getPrecipitationAmountId(amount) {
    if (amount < 0.20) {
      return 'nothing'
    } else if (amount < 0.40) {
      return 'slight'
    } else if (amount < 0.70) {
      return 'average'
    } else if (amount < 0.95) {
      return 'heavy'
    } else {
      return 'extreme'
    }
  }

  static _getPrecipitationTypeId(type) {
    switch (type) {
      case 0:
      default:
        return 'none'
      case 1:
        return 'drizzle'
      case 2:
        return 'rain'
      case 3:
        return 'downpour'
      case 4:
        return 'hail'
      case 5:
        return 'snow'
      case 6:
        return 'blizzard'
    }
  }

  // https://education.nationalgeographic.org/resource/beaufort-scale/
  static _getWindSpeedId(wind) {
    let gusting = ''
    if (wind.gusts > 5) {
      gusting = 'Gusting'
    }
    if (wind.speed < 1) {
      return 'calm' + gusting  // Calm and Still
    } else if (wind.speed < 5) {
      return 'light' + gusting // Light Wind
    } else if (wind.speed < 11) {
      return 'lightBreeze' + gusting // Light breeze
    } else if (wind.speed < 28) {
      return 'gentleBreeze' + gusting // Gentle breeze
    } else if (wind.speed < 38) {
      return 'freshBreeze' + gusting // Fresh Breeze
    } else if (wind.speed < 49) {
      return 'strongBreeze' + gusting // Strong breeze
    } else if (wind.speed < 61) {
      return 'moderateGale' + gusting // Moderate Gale
    } else if (wind.speed < 74) {
      return 'freshGale' + gusting // Fresh gale
    } else if (wind.speed < 88) {
      return 'strongGale' + gusting // Strong gale
    } else if (wind.speed < 102) {
      return 'wholeGale' + gusting // WHole Gale
    } else if (wind.speed < 118) {
      return 'storm' + gusting // Storm
    } else {
      return 'hurricane' + gusting // Hurricane
    }
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
        'direction': modelData.wind.direction,
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

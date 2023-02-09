import { Logger, Utils } from './utils.js'
import { SceneWeather } from './sceneWeather.js'

/**
 *  WeatherModel produces SceneWeather (which also can be set via Weather Template option)
 */
export class WeatherModel {

  /*
      Input:
      - RegionMeteo    
  
      Internal Calculation for/via manual setting:
      - Ground Temperature
      - Air Temperature
      - Perceived Temperature
      - Windspeed
      - Wind Gusts
      - Wind Direction
      - Cloud Coverage
      - Cloud Bottoms
      - Cloud Tops
      - Precipitation amount
      - Precipitation type
      - Humidity
  
      Output:
      - SceneWeather
  */

  static templates = {
    'default': {
      'name': 'Default',
      'temp': {
        'ground': 14,
        'air': 18,
        'percieved': 18
      },
      'wind': {
        'speed': 0,
        'gusts': 0,
        'direction': 0
      },
      'clouds': {
        'coverage': 0,
        'bottom': 0,
        'top': 0
      },
      'precipitation': {
        'amount': 0,
        'type': 'none'
      },
      'humidity': 0
    }
  }

  /**
   * TODO
   * @param {*} param0 
   */
  constructor({ regionMeteo, templateId = 'default' }) {
    Logger.debug('WeatherModel:constrctor', { 'regionMeteo': regionMeteo, 'templateId': templateId })
    if (regionMeteo === undefined) {
      this.templateId = templateId
      this.regionMeteo = undefined
    } else {
      this.templateId = null
      this.regionMeteo = regionMeteo
    }
  }

  /**
   * TODO update the weather model
   */
  async update() {
    if (this.regionMeteo !== undefined) {
      this.regionMeteo.update()
    }
  }

  /**
   * TODO
   * @returns - array of dictionaries containing 'id' and 'name'
   */
  static getTemplates() {
    let res = []
    for (let id in WeatherModel.templates) {
      res.push({
        'id': id,
        'name': WeatherModel.templates[id].name
      })
    }
    Logger.debug('getTemplates', { 'res': res })
    return res
  }

  /**
   * TODO Builder pattern
   * @param {*} id 
   * @returns 
   */
  static fromTemplate(id) {
    return new WeatherModel({ 'templateId': id })
  }

  /**
   * TODO Builder pattern
   * @param {*} regionMeteo 
   * @returns 
   */
  static fromRegion(regionMeteo) {
    return new WeatherModel({ 'regionMeteo': regionMeteo })
  }

}

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
  async update() {
    this.weatherModel.update()
    //this.temperatue.air = this.weatherModel.getAirTemp()
    //this.temperatue.ground = this.weatherModel.getGroundTemp()
    //this.temperatue.perceived = 0 // TODO with wind calculation
  }

  /**
   * TODO invoke via layer menu buttons -> see there
   */
  async applyFxToScene() {

  }

  // disableFxOnScene()

  // updateFxOnScene()

}

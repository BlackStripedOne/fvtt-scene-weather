import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'
import { ColorFilter } from './colorFilter.js'

Hooks.on(MODULE.LCCNAME + 'RegisterFilters', async () => {
  Logger.debug('registered filter for freeze')
  game.sceneWeather.filters.push({
    'name': 'freeze',
    'getFilterConfig': function (modelData) {
      let filterConfigs = {}

      if (modelData.temp.air < 0) {
        filterConfigs['freeze'] = {
          type: ColorFilter,
          tint: Utils.mapColorHex(modelData.temp.air + 10, 0, 10, '#E1F3FE', '#FFFFFF'),
          saturation: 1.0 - Utils.map(modelData.temp.air + 10, 10, 0, 0, 0.4),
          gamma: 1,
          brightness: 1,
          contrast: 1
        }
      }

      return filterConfigs
    }
  })
})

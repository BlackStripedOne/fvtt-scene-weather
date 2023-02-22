import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'
import { ColorFilter } from './colorFilter.js'
import { FlashFilter } from './flashFilter.js'

Hooks.on(MODULE.LCCNAME + 'RegisterFilters', async () => {
  Logger.debug('registered filter for lightning')
  game.sceneWeather.filters.push({
    'name': 'lightning',
    'getFilterConfig': function (modelData) {
      let filterConfigs = {}

      if (modelData.clouds.type > 3                             // TCU
        && [2, 3, 4].includes(modelData.precipitation.type)   // RAIN, DOWNPOUR, HAIL
        && modelData.precipitation.amount > 0.3) {

        filterConfigs['lightning'] = {
          type: FlashFilter,
          frequency: 2000 - Utils.map(modelData.precipitation.amount, 0.3, 1.0, 0, 1600), // 2000 low intensity .. 800 high intensity
          duration: 100,
          brightness: 1.2
        }
        filterConfigs['cloudcolor'] = {
          type: ColorFilter,
          tint: '#D1CBD7',
          saturation: 1,
          gamma: 1,
          brightness: 1,
          contrast: 1
        }
      }

      return filterConfigs
    }
  })
})

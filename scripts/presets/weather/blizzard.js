import { Logger, Utils } from '../../utils.js'
import { MODULE, PRECI_TYPE, CLOUD_TYPE } from '../../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterWeatherTemplate', async () => {
  Logger.debug('registered weatherTemplate for blizzard')
  Utils.getApi().weatherTemplates.push({
    'id': 'blizzard',
    'name': 'Blizzard',
    'temp': {
      'ground': 0,
      'air': -3,
      'percieved': -4
    },
    'wind': {
      'speed': 70,
      'gusts': 85,
      'direction': 115
    },
    'clouds': {
      'coverage': 0.7,
      'bottom': 1000,
      'top': 3000,
      'type': CLOUD_TYPE.cumulunimbus
    },
    'precipitation': {
      'amount': 1.0,
      'type': PRECI_TYPE.blizzard
    },
    'sun': {
      'amount': 0.1,
    },
    'humidity': 10
  })
})

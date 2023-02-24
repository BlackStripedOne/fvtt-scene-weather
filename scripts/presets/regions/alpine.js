import { Logger, Utils } from '../../utils.js'
import { MODULE } from '../../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterRegionTemplate', async () => {
  Logger.debug('registered regionTemplate for alpine')
  Utils.getApi().regionTemplates.push({
    'id': 'alpine',
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
  })
})

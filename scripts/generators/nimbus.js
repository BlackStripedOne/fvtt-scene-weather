import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for rain')
  game.sceneWeather.generators.push({
    'name': 'rain',
    'getEmitter': function (modelData) {

      /* precipitation type:
        0: none
        1: drizzle
        2: rain
        3: downpour
        4: hail
        5: snow
        6: blizzard
      */
      if (![1, 2, 3, 4].includes(modelData.precipitation.type)) return null

      const generatorOptions = {
        direction: (Math.round(modelData.wind.direction) + 90) % 360,               // 0..359 via Winddirection
        speed: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.6, 2.0),      // 0.6 drizzle, 2.0 heavy rain 
        scale: 1,
        lifetime: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 1.0, 0.5),   // 1 drizzle, 0.5 heavy rain
        density: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.1, 4.0),    // 0.1 drizzle, 4: heavy rain
        tint: null
      }

      const rainConfig = foundry.utils.deepClone({
        lifetime: {
          min: 0.5,
          max: 0.5
        },
        pos: {
          x: 0,
          y: 0
        },
        behaviors: [
          {
            type: 'alpha',
            config: {
              alpha: {
                list: [
                  {
                    time: 0,
                    value: 0.7
                  },
                  {
                    time: 1,
                    value: 0.1
                  }
                ]
              }
            }
          },
          {
            type: 'moveSpeedStatic',
            config: {
              min: 2800,
              max: 3500
            }
          },
          {
            type: 'scaleStatic',
            config: {
              min: 0.8,
              max: 1
            }
          },
          {
            type: 'rotationStatic',
            config: {
              min: 89,
              max: 91
            }
          },
          {
            type: 'textureSingle',
            config: {
              texture: 'ui/particles/rain.png'
            }
          }
        ]
      })
      Generators.applyGeneratorToEmitterConfig(generatorOptions, rainConfig)
      return rainConfig
    }
  })
})
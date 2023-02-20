import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for snow')
  game.sceneWeather.generators.push({
    'name': 'snow',
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
      if (![5, 6].includes(modelData.precipitation.type)) return null

      const generatorOptions = {
        direction: (Math.round(modelData.wind.direction) + 90) % 360,               // 0..359 via Winddirection
        speed: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.3, 5.0),      // 0.3 drizzle, 5 blizzard
        scale: 1,
        lifetime: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 1.0, 0.7),   // 1 drizzle, 0.7 blizzard
        density: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.1, 3.0),    // 0.1 drizzle, 3: blizzard
        tint: null
      }

      const snowConfig = foundry.utils.deepClone({
        lifetime: {
          min: 4,
          max: 4
        },
        behaviors: [
          {
            type: 'alpha',
            config: {
              alpha: {
                list: [
                  {
                    time: 0,
                    value: 0.9
                  },
                  {
                    time: 1,
                    value: 0.5
                  }
                ]
              }
            }
          },
          {
            type: 'moveSpeed',
            config: {
              speed: {
                list: [
                  {
                    time: 0,
                    value: 190
                  },
                  {
                    time: 1,
                    value: 210
                  }
                ]
              },
              minMult: 0.6
            }
          },
          {
            type: 'scale',
            config: {
              scale: {
                list: [
                  {
                    time: 0,
                    value: 0.2
                  },
                  {
                    time: 1,
                    value: 0.4
                  }
                ]
              },
              minMult: 0.5
            }
          },
          {
            type: 'rotation',
            config: {
              accel: 0,
              minSpeed: 0,
              maxSpeed: 200,
              minStart: 50,
              maxStart: 75
            }
          },
          {
            type: 'textureSingle',
            config: {
              texture: 'ui/particles/snow.png'
            }
          }
        ]
      })
      Generators.applyGeneratorToEmitterConfig(generatorOptions, snowConfig)
      return snowConfig
    }
  })
})
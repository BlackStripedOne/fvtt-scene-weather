import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

// https://pixijs.io/particle-emitter/examples/snow.html
Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for snow')
  game.sceneWeather.generators.push({
    'name': 'snow',
    'getEmitter': function (modelData) {

      if (Utils.getSetting('precipitationAlpha', 100) < 2) {
        return undefined
      }

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

      let snowDirection = 90
      const snowMode = modelData.precipitation.mode ?? 'winddir'
      switch (snowMode) {
        case 'winddir':
        default:
          // 0..359 via Winddirection
          snowDirection = (Math.round(modelData.wind.direction) + 90) % 360
          break
        case 'topdown':
          snowDirection = 90  // Top
          break
        case 'slanted':
          snowDirection = 75  // Slightly from Left
          break
        case 'windinfluence':
          const vecH = Math.sin(modelData.wind.direction * Math.PI / 180) * Utils.map(modelData.wind.speed, 10, 70, 10, 90) // Deflection between -90 .. 90 deg
          snowDirection = 90 + vecH
          break
      }

      const generatorOptions = {
        alpha: Utils.getSetting('precipitationAlpha', 100) / 100,  // Client based percentage for precipitation transparency
        direction: snowDirection,
        speed: Utils.map(modelData.wind.speed, 10, 70, 0.3, 5.0),      // 0.3 drizzle, 5 blizzard
        scale: 1,
        lifetime: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 1.0, 0.7),   // 1 drizzle, 0.7 blizzard
        density: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.01, 3.0),    // 0.1 drizzle, 3: blizzard
        tint: null
      }

      const snowConfig = Utils.deepClone({
        weight: 0.2,
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

import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for fog')
  game.sceneWeather.generators.push({
    'name': 'fog',
    'getEmitter': function (modelData) {

      if (Utils.getSetting('cloudsAlpha', 100) < 2) {
        return undefined
      }

      /*
       cloud types:
       0: none
       1: groundfog
       2: stratus
       3: cumulus
       4: cumulunimbus
      */
      if (modelData.clouds.type != 1) return null

      const generatorOptions = {
        alpha: Utils.getSetting('cloudsAlpha', 100) / 100,  // Client based percentage for cloud transparency
        direction: 0,
        speed: 1,
        scale: 1,
        lifetime: 1,
        density: Utils.map(modelData.clouds.coverage, 0.2, 1, 0.01, 1),
        tint: null
      }

      const fogConfig = foundry.utils.deepClone({
        lifetime: {
          min: 10,
          max: 25
        },
        behaviors: [
          {
            type: 'alpha',
            config: {
              alpha: {
                list: [
                  {
                    value: 0,
                    time: 0
                  },
                  {
                    value: 0.1,
                    time: 0.1
                  },
                  {
                    value: 0.3,
                    time: 0.5
                  },
                  {
                    value: 0.1,
                    time: 0.9
                  },
                  {
                    value: 0,
                    time: 1
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
                    value: 15
                  },
                  {
                    time: 1,
                    value: 10
                  }
                ]
              },
              minMult: 0.2
            }
          },
          {
            type: 'scale',
            config: {
              scale: {
                list: [
                  {
                    value: 2.5,
                    time: 0
                  },
                  {
                    value: 2,
                    time: 1
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
              minSpeed: 0.15,
              maxSpeed: 0.35,
              minStart: 0,
              maxStart: 365
            }
          },
          {
            type: 'textureRandom',
            config: {
              textures: Array.fromRange(3).map(
                (n) => 'modules/' + MODULE.ID + `/assets/fg${n + 1}.webp`
              )
            }
          },
          {
            type: 'colorStatic',
            config: {
              color: 'dddddd'
            }
          }
        ]
      })

      Generators.applyGeneratorToEmitterConfig(generatorOptions, fogConfig)
      return fogConfig
    }
  })
})

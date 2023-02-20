import { Generators } from './generators.js'
import { Logger } from '../utils.js'
import { MODULE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for fog')
  game.sceneWeather.generators.push({
    'name': 'fog',
    'getEmitter': function (modelData) {

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
        direction: 0,
        speed: 1,
        scale: 1,
        lifetime: 1,
        density: 0.1,
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
                    value: 1.5,
                    time: 0
                  },
                  {
                    value: 1,
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

      Generators.applyGeneratorOptionsToEmitterConfig(generatorOptions, fogConfig)
      return fogConfig
    }
  })
})
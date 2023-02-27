import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for cumulus')
  game.sceneWeather.generators.push({
    'name': 'cumulus',
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
      if (![3, 4].includes(modelData.clouds.type)) return null

      let generatorOptions = {
        alpha: Utils.getSetting('cloudsAlpha', 100) / 100,  // Client based percentage for cloud transparency
        direction: (Math.round(modelData.wind.direction) + 90) % 360,         // 0..359 via Winddirection
        speed: Utils.map(modelData.wind.speed, 10, 70, 0.2, 3.0),  // 0.2 nearly no wind, 4 much wind, 5 storm
        scale: Utils.map(modelData.clouds.coverage, 0.3, 1, 0.8, 1),          // 1 few clouds, 2 overcast
        lifetime: 1,
        density: Utils.map(modelData.clouds.coverage, 0.2, 1, 0.005, 0.02),   // 0.01 few clouds, 0.1 overcast
        tint: null
      }

      // Darker cumulus below cumulunimbus clouds
      if (modelData.clouds.type == 4) {
        generatorOptions.tint = '#B0B0B0'                                     // 250,250,250 few clouds  180,180,180 overcast
        generatorOptions.density = 0.001
      }

      const cumulusConfig = foundry.utils.deepClone({
        weight: 0.8,
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
                    value: 0.5,
                    time: 0.05
                  },
                  {
                    value: 0.5,
                    time: 0.95
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
            type: 'moveSpeedStatic',
            config: {
              min: 30,
              max: 100
            }
          },
          {
            type: 'scaleStatic',
            config: {
              min: 2.58,
              max: 3.3
            }
          },
          {
            type: 'rotationStatic',
            config: {
              min: 85,
              max: 95
            }
          },
          {
            type: 'textureRandom',
            config: {
              textures: Array.fromRange(5).map(
                (n) => 'modules/' + MODULE.ID + `/assets/cu${n + 1}.webp`
              )
            }
          }
        ]
      })

      Generators.applyGeneratorToEmitterConfig(generatorOptions, cumulusConfig)
      return cumulusConfig
    }
  })
})

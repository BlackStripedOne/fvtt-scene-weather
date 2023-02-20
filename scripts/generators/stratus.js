import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for stratus')
  game.sceneWeather.generators.push({
    'name': 'stratus',
    'getEmitter': function (modelData) {

      /*
       cloud types:
       0: none
       1: groundfog
       2: stratus
       3: cumulus
       4: cumulunimbus
      */
      if (![2, 3, 4].includes(modelData.clouds.type)) return null

      let generatorOptions = {
        direction: (Math.round(modelData.wind.direction) + 90) % 360,           // 0..359 via Winddirection
        speed: Utils.map(modelData.precipitation.amount, 10, 100, 0.2, 4.0),    // 0.2 nearly no wind, 4 much wind, 5 storm
        scale: Utils.map(modelData.clouds.coverage, 0.3, 1, 0.8, 1),            // 1 few clouds, 2 overcast
        lifetime: 1,
        density: Utils.map(modelData.clouds.coverage, 0.2, 1, 0.005, 0.02),     // 0.01 few clouds, 0.1 overcast
        tint: null                                                              // 250,250,250 few clouds  180,180,180 overcast
      }

      // Darker cumulus below cumulunimbus clouds
      if (modelData.clouds.type == 3) {
        generatorOptions.tint = '#A0A0A0'                                       // 250,250,250 few clouds  180,180,180 overcast
        generatorOptions.density = 0.007
        generatorOptions.scale = 1
      }

      // Darker cumulus below cumulunimbus and cumulus clouds
      if (modelData.clouds.type == 4) {
        generatorOptions.tint = '#808080'                                       // 250,250,250 few clouds  180,180,180 overcast
        generatorOptions.density = 0.01
        generatorOptions.scale = 1.2
      }

      const stratusConfig = foundry.utils.deepClone({
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
              min: 80,
              max: 100
            }
          },
          {
            type: 'textureRandom',
            config: {
              textures: Array.fromRange(6).map(
                (n) => 'modules/' + MODULE.ID + `/assets/st${n + 1}.webp`
              )
            }
          }
        ]
      })
      Generators.applyGeneratorToEmitterConfig(generatorOptions, stratusConfig)
      return stratusConfig
    }
  })
})
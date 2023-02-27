/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.

You may obtain a copy of the License at:
https://creativecommons.org/licenses/by-sa/4.0/legalcode

Code written by BlackStripedOne can be found at:
https://github.com/BlackStripedOne

This source is part of the SceneWeather module for FoundryVTT virtual tabletop game that can be found at:
https://github.com/BlackStripedOne/fvtt-scene-weather

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

import { Generators } from './generators.js'
import { Logger, Utils } from '../utils.js'
import { MODULE, CLOUD_TYPE } from '../constants.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  Logger.debug('registered generator for stratus')
  game.sceneWeather.generators.push({
    'name': 'stratus',
    'getEmitter': function (modelData) {

      if (Utils.getSetting('cloudsAlpha', 100) < 2) {
        return undefined
      }

      if (![CLOUD_TYPE.stratus, CLOUD_TYPE.cumulus, CLOUD_TYPE.cumulunimbus].includes(modelData.clouds.type)) return null

      let generatorOptions = {
        alpha: Utils.getSetting('cloudsAlpha', 100) / 100,  // Client based percentage for cloud transparency
        direction: (Math.round(modelData.wind.direction) + 90) % 360,           // 0..359 via Winddirection
        speed: Utils.map(modelData.wind.speed, 10, 100, 0.2, 2.5),    // 0.2 nearly no wind, 4 much wind, 5 storm
        scale: Utils.map(modelData.clouds.coverage, 0.3, 1, 1, 2),            // 1 few clouds, 2 overcast
        lifetime: 1,
        density: Utils.map(modelData.clouds.coverage, 0.2, 1, 0.001, 0.01),     // 0.01 few clouds, 0.1 overcast
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
        weight: 0.7,
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

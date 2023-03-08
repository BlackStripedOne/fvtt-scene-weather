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
import { Utils } from '../utils.js'
import { EVENTS, MODULE, CLOUD_TYPE } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.REG_FX_GENERATORS, async () => {
  SceneWeather.registerWeatherFxGenerator('cumulus', function (modelData) {
    if (Fal.getSetting('cloudsAlpha', 100) < 2) {
      return undefined
    }

    if (![CLOUD_TYPE.cumulus, CLOUD_TYPE.cumulunimbus].includes(modelData.clouds.type)) return null

    let generatorOptions = {
      alpha: Fal.getSetting('cloudsAlpha', 100) / 100,                    // Client based percentage for cloud transparency
      direction: (Math.round(modelData.wind.direction) + 90) % 360,         // 0..359 via Winddirection
      speed: Utils.map(modelData.wind.speed, 10, 70, 0.2, 3.0),             // 0.2 nearly no wind, 4 much wind, 5 storm
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

    const cumulusConfig = Utils.deepClone({
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
  })
})

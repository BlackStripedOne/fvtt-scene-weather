/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
This software has been made possible by my loving husband, who supports my hobbies by creating freetime for me. <3

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
import { MODULE, CLOUD_TYPE } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  SceneWeather.registerWeatherFxGenerator('fog', function (modelData) {
    if (Fal.getSetting('cloudsAlpha', 100) < 2) {
      return undefined
    }

    if (modelData.clouds.type != CLOUD_TYPE.fog) return null

    const generatorOptions = {
      alpha: Fal.getSetting('cloudsAlpha', 100) / 100, // Client based percentage for cloud transparency
      direction: 0,
      speed: 1,
      scale: 1,
      lifetime: 1,
      density: Utils.map(modelData.clouds.coverage, 0.2, 1, 0.01, 1),
      tint: null
    }

    const fogConfig = Utils.deepClone({
      weight: 0.9,
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
  })
})

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
import { MODULE, PRECI_TYPE } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

// https://pixijs.io/particle-emitter/examples/snow.html
Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  SceneWeather.registerWeatherFxGenerator('snow', function (modelData) {
    if (Fal.getSetting('precipitationAlpha', 100) < 2) {
      return undefined
    }

    if (![PRECI_TYPE.snow, PRECI_TYPE.blizzard].includes(modelData.precipitation.type)) return null

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
      alpha: Fal.getSetting('precipitationAlpha', 100) / 100,  // Client based percentage for precipitation transparency
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
  })
})

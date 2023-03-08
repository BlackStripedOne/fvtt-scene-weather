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

// https://pixijs.io/particle-emitter/examples/rain.html
Hooks.on(MODULE.LCCNAME + 'RegisterGenerators', async () => {
  SceneWeather.registerWeatherFxGenerator('rain', function (modelData) {
    if (Fal.getSetting('precipitationAlpha', 100) < 2) {
      return undefined
    }

    if (![PRECI_TYPE.drizzle, PRECI_TYPE.rain, PRECI_TYPE.downpour, PRECI_TYPE.hail].includes(modelData.precipitation.type)) return null

    let rainDirection = 90
    const rainMode = modelData.precipitation.mode ?? 'winddir'
    switch (rainMode) {
      case 'winddir':
      default:
        // 0..359 via Winddirection
        rainDirection = (Math.round(modelData.wind.direction) + 90) % 360
        break
      case 'topdown':
        rainDirection = 90  // Top
        break
      case 'slanted':
        rainDirection = 75  // Slightly from Left
        break
      case 'windinfluence':
        const vecH = Math.sin(modelData.wind.direction * Math.PI / 180) * Utils.map(modelData.wind.speed, 10, 70, 3, 45) // Deflection between -45 .. 45 deg
        rainDirection = 90 + vecH
        break
    }

    const generatorOptions = {
      alpha: Fal.getSetting('precipitationAlpha', 100) / 100,  // Client based percentage for precipitation transparency
      direction: rainDirection,
      speed: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.6, 2.0),      // 0.6 drizzle, 2.0 heavy rain 
      scale: 1,
      lifetime: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 1.0, 0.5),   // 1 drizzle, 0.5 heavy rain
      density: Utils.map(modelData.precipitation.amount, 0.4, 0.95, 0.01, 4.0),    // 0.1 drizzle, 4: heavy rain
      tint: null
    }

    const rainConfig = Utils.deepClone({
      weight: 0.2,
      lifetime: {
        min: 0.5,
        max: 0.5
      },
      pos: {
        x: 0,
        y: 0
      },
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                {
                  time: 0,
                  value: 0.7
                },
                {
                  time: 1,
                  value: 0.1
                }
              ]
            }
          }
        },
        {
          type: 'moveSpeedStatic',
          config: {
            min: 2800,
            max: 3500
          }
        },
        {
          type: 'scaleStatic',
          config: {
            min: 0.8,
            max: 1
          }
        },
        {
          type: 'rotationStatic',
          config: {
            min: 89,
            max: 91
          }
        },
        {
          type: 'textureSingle',
          config: {
            texture: 'ui/particles/rain.png'
          }
        }
      ]
    })
    Generators.applyGeneratorToEmitterConfig(generatorOptions, rainConfig)
    return rainConfig
  })
})

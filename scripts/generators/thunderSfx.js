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

import { MODULE, EVENTS, PRECI_TYPE, CLOUD_TYPE } from '../constants.js'

Hooks.on(EVENTS.REG_WEATHER_SFX, (sfxHandler) => {
  sfxHandler.registerSfx('thunder', 'modules/' + MODULE.ID + '/assets/thunder.ogg', {
    matchAny: {
      'base.clouds.type': [CLOUD_TYPE.cumulunimbus],
      'clouds.type': [CLOUD_TYPE.cumulunimbus],
      'base.precipitation.type': [
        PRECI_TYPE.drizzle,
        PRECI_TYPE.rain,
        PRECI_TYPE.downpour,
        PRECI_TYPE.hail
      ]
    },
    gainMatrix: [
      // baseGain, actualGain
      [0.0, 1.0], // outside
      [1.0, 1.0], // lightroof
      [1.0, 1.0], // roof
      [0.3, 1.0], // inside
      [0.0, 0.0] // underground
    ],
    baseValue: 'base.precipitation.amount',
    actualValue: 'precipitation.amount',
    baseGain: [
      { position: 0.35, gain: 0.0 },
      { position: 0.4, gain: 1.0 }
    ],
    actualGain: [
      { position: 0.35, gain: 0.0 },
      { position: 0.4, gain: 1.0 }
    ]
  })

  sfxHandler.registerSfx('distantThunder', 'modules/' + MODULE.ID + '/assets/thunder_distant.ogg', {
    matchAny: {
      'base.clouds.type': [CLOUD_TYPE.cumulunimbus],
      'clouds.type': [CLOUD_TYPE.cumulunimbus],
      'base.precipitation.type': [
        PRECI_TYPE.drizzle,
        PRECI_TYPE.rain,
        PRECI_TYPE.downpour,
        PRECI_TYPE.hail
      ]
    },
    gainMatrix: [
      [0.0, 0.0], // outside
      [0.8, 0.0], // lightroof
      [0.7, 0.2], // roof
      [0.5, 0.5], // inside
      [0.1, 0.1] // underground
    ],
    baseValue: 'base.precipitation.amount',
    actualValue: 'precipitation.amount',
    baseGain: [
      { position: 0.35, gain: 1.0 },
      { position: 0.4, gain: 0.0 }
    ],
    actualGain: [
      { position: 0.35, gain: 1.0 },
      { position: 0.4, gain: 0.0 }
    ]
  })
})

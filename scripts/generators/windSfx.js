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

import { MODULE, EVENTS, WIND_SPEED } from '../constants.js'

Hooks.on(EVENTS.REG_WEATHER_SFX, (sfxHandler) => {
  sfxHandler.registerSfx('wind', 'modules/' + MODULE.ID + '/assets/wind.ogg', {
    gainMatrix: [
      // baseGain, actualGain
      [0.0, 1.0], // outside
      [0.0, 1.0], // lightroof
      [0.0, 1.0], // roof
      [0.0, 1.0], // inside
      [0.0, 0.0] // underground
    ],
    baseValue: 'base.wind.speed',
    actualValue: 'wind.speed',
    baseGain: [
      { position: WIND_SPEED.calm, gain: 0.0 },
      { position: WIND_SPEED.strongBreeze, gain: 1.0 },
      { position: WIND_SPEED.strongBreeze + 10, gain: 0.0 }
    ],
    actualGain: [
      { position: WIND_SPEED.calm, gain: 0.0 },
      { position: WIND_SPEED.strongBreeze, gain: 1.0 },
      { position: WIND_SPEED.strongBreeze + 10, gain: 0.0 }
    ]
  })

  sfxHandler.registerSfx('strongWind', 'modules/' + MODULE.ID + '/assets/strong_wind.ogg', {
    gainMatrix: [
      // baseGain, actualGain
      [0.0, 1.0], // outside
      [0.0, 1.0], // lightroof
      [0.0, 1.0], // roof
      [0.02, 1.0], // inside
      [0.0, 0.0] // underground
    ],
    baseValue: 'base.wind.speed',
    actualValue: 'wind.speed',
    baseGain: [
      { position: WIND_SPEED.freshBreeze, gain: 0.0 },
      { position: WIND_SPEED.wholeGale, gain: 1.0 },
      { position: WIND_SPEED.wholeGale + 10, gain: 0.0 }
    ],
    actualGain: [
      { position: WIND_SPEED.freshBreeze, gain: 0.0 },
      { position: WIND_SPEED.wholeGale, gain: 1.0 },
      { position: WIND_SPEED.wholeGale + 10, gain: 0.0 }
    ]
  })
})

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

import { Logger, Utils } from '../../utils.js'
import { EVENTS, PRECI_TYPE, CLOUD_TYPE } from '../../constants.js'

Hooks.on(EVENTS.REG_TEMPLATE_WEATHER, async () => {
  Logger.debug('registered weatherTemplate for blizzard')
  Utils.getApi().weatherTemplates.push({
    'id': 'blizzard',
    'name': 'Blizzard',
    'temp': {
      'ground': 0,
      'air': -3,
      'percieved': -4
    },
    'wind': {
      'speed': 70,
      'gusts': 85,
      'direction': 115
    },
    'clouds': {
      'coverage': 0.7,
      'bottom': 1000,
      'top': 3000,
      'type': CLOUD_TYPE.cumulunimbus
    },
    'precipitation': {
      'amount': 1.0,
      'type': PRECI_TYPE.blizzard
    },
    'sun': {
      'amount': 0.1,
    },
    'humidity': 10
  })
})

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

import { EVENTS, MODULE, PRECI_TYPE, CLOUD_TYPE } from '../../constants.js'

Hooks.on(EVENTS.REG_TEMPLATE_WEATHER, async () => {
  SceneWeather.registerWeatherTemplate(MODULE.ID, 'thunderstorm', {
    'name': 'templates.weather.thunderstorm.name',
    'temp': {
      'ground': 14,
      'air': 13,
      'percieved': 11
    },
    'wind': {
      'speed': 50,
      'gusts': 75,
      'direction': 90
    },
    'clouds': {
      'coverage': 0.95,
      'bottom': 500,
      'top': 8000,
      'type': CLOUD_TYPE.cumulunimbus
    },
    'precipitation': {
      'amount': 0.95,
      'type': PRECI_TYPE.downpour
    },
    'sun': {
      'amount': 0.1,
    },
    'humidity': 70
  })
})

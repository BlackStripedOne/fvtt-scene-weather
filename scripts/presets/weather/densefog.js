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
  SceneWeather.registerWeatherTemplate(MODULE.ID, 'densefog', {
    'name': 'templates.weather.densefog.name',
    'temp': {
      'ground': 18,
      'air': 15,
      'percieved': 16
    },
    'wind': {
      'speed': 15,
      'gusts': 16,
      'direction': 127
    },
    'clouds': {
      'coverage': 0.9,
      'bottom': 0,
      'top': 3000,
      'type': CLOUD_TYPE.fog
    },
    'precipitation': {
      'amount': 0,
      'type': PRECI_TYPE.none
    },
    'sun': {
      'amount': 0.6,
    },
    'humidity': 80
  })
})

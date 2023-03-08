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

import { EVENTS, MODULE } from '../../constants.js'

Hooks.on(EVENTS.REG_TEMPLATE_REGION, async () => {
  SceneWeather.registerRegionTemplate(MODULE.ID, 'taiga', {
    'name': 'templates.region.taiga.name',
    'description': 'templates.region.taiga.description',
    'elevation': 400,
    'vegetation': 70,
    'waterAmount': 10,
    'summer': {
      'temperature': {
        'day': 20,
        "night": 10,
        "var": 10
      },
      'humidity': {
        'day': 70,
        'night': 80,
        'var': 5
      },
      'wind': {
        'avg': 15,
        'var': 10
      },
      'sun': {
        'hours': 17
      }
    },
    'winter': {
      'temperature': {
        'day': -5,
        "night": -25,
        "var": 10
      },
      'humidity': {
        'day': 80,
        'night': 60,
        'var': 5
      },
      'wind': {
        'avg': 25,
        'var': 10
      },
      'sun': {
        'hours': 8
      }
    }
  })
})

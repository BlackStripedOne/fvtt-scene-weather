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
  // https://en.wikipedia.org/wiki/Mangrove
  SceneWeather.registerRegionTemplate(MODULE.ID, 'mangrove', {
    'name': 'templates.region.mangrove.name',
    'description': 'templates.region.mangrove.description',
    'elevation': 0,
    'vegetation': 80,
    'waterAmount': 60,
    'summer': {
      'temperature': {
        'day': 32.5,
        "night": 22.5,
        "var": 5
      },
      'humidity': {
        'day': 60,
        'night': 70,
        'var': 10
      },
      'wind': {
        'avg': 10,
        'var': 5
      },
      'sun': {
        'hours': 16
      }
    },
    'winter': {
      'temperature': {
        'day': 27.5,
        "night": 17.5,
        "var": 5
      },
      'humidity': {
        'day': 60,
        'night': 60,
        'var': 10
      },
      'wind': {
        'avg': 15,
        'var': 10
      },
      'sun': {
        'hours': 8
      }
    }
  })
})

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
  SceneWeather.registerRegionTemplate(MODULE.ID, 'temperate', {
    'name': 'templates.region.temperate.name',
    'description': 'templates.region.temperate.description',
    'elevation': 400,
    'vegetation': 50,
    'waterAmount': 10,
    'summer': {
      'temperature': {
        'day': 25,
        "night": 15,
        "var": 10
      },
      'humidity': {
        'day': 70,
        'night': 60,
        'var': 10
      },
      'wind': {
        'avg': 15,
        'var': 10
      },
      'sun': {
        'hours': 15
      }
    },
    'winter': {
      'temperature': {
        'day': 10,
        "night": 0,
        "var": 10
      },
      'humidity': {
        'day': 60,
        'night': 65,
        'var': 5
      },
      'wind': {
        'avg': 20,
        'var': 10
      },
      'sun': {
        'hours': 9
      }
    }
  })
})

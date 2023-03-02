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
import { EVENTS } from '../../constants.js'

Hooks.on(EVENTS.REG_TEMPLATE_REGION, async () => {
  // https://en.wikipedia.org/wiki/Chaparral
  Logger.debug('registered regionTemplate for chaparral')
  Utils.getApi().regionTemplates.push({
    'id': 'chaparral',
    'name': 'templates.region.chaparral.name',
    'description': 'templates.region.chaparral.description',
    'elevation': 1000,
    'vegetation': 5,
    'waterAmount': 5,
    'summer': {
      'temperature': {
        'day': 32.5,
        "night": 17.5,
        "var": 5
      },
      'humidity': {
        'day': 60,
        'night': 40,
        'var': 5
      },
      'wind': {
        'avg': 25,
        'var': 10
      },
      'sun': {
        'hours': 13
      }
    },
    'winter': {
      'temperature': {
        'day': 17.5,
        "night": 2.5,
        "var": 5
      },
      'humidity': {
        'day': 60,
        'night': 50,
        'var': 5
      },
      'wind': {
        'avg': 30,
        'var': 10
      },
      'sun': {
        'hours': 11
      }
    }
  })
})

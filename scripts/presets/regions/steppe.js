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

import { EVENTS, MODULE } from '../../constants.js'

Hooks.on(EVENTS.REG_TEMPLATE_REGION, async () => {
  SceneWeather.registerRegionTemplate(MODULE.ID, 'steppe', {
    name: 'templates.region.steppe.name',
    description: 'templates.region.steppe.description',
    elevation: 500,
    vegetation: 5,
    waterAmount: 0,
    summer: {
      temperature: {
        day: 27.5,
        night: 15,
        var: 5
      },
      humidity: {
        day: 30,
        night: 25,
        var: 5
      },
      wind: {
        avg: 25,
        var: 10
      },
      sun: {
        hours: 14
      }
    },
    winter: {
      temperature: {
        day: 5,
        night: -5,
        var: 10
      },
      humidity: {
        day: 40,
        night: 30,
        var: 10
      },
      wind: {
        avg: 20,
        var: 10
      },
      sun: {
        hours: 10
      }
    }
  })
})

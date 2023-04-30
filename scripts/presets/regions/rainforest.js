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
  SceneWeather.registerRegionTemplate(MODULE.ID, 'rainforest', {
    name: 'templates.region.rainforest.name',
    description: 'templates.region.rainforest.description',
    elevation: 200,
    vegetation: 100,
    waterAmount: 80,
    summer: {
      temperature: {
        day: 32.5,
        night: 22.5,
        var: 5
      },
      humidity: {
        day: 90,
        night: 80,
        var: 10
      },
      wind: {
        avg: 5,
        var: 5
      },
      sun: {
        hours: 12
      }
    },
    winter: {
      temperature: {
        day: 32.5,
        night: 22.5,
        var: 5
      },
      humidity: {
        day: 80,
        night: 70,
        var: 10
      },
      wind: {
        avg: 5,
        var: 5
      },
      sun: {
        hours: 12
      }
    }
  })
})

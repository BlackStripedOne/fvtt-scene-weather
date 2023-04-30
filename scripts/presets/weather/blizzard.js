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

import { EVENTS, MODULE, PRECI_TYPE, CLOUD_TYPE } from '../../constants.js'

Hooks.on(EVENTS.REG_TEMPLATE_WEATHER, async () => {
  SceneWeather.registerWeatherTemplate(MODULE.ID, 'blizzard', {
    name: 'templates.weather.blizzard.name',
    temp: {
      ground: 0,
      air: -3,
      percieved: -4
    },
    wind: {
      speed: 70,
      gusts: 85,
      direction: 115
    },
    clouds: {
      coverage: 0.7,
      bottom: 1000,
      top: 3000,
      type: CLOUD_TYPE.cumulunimbus
    },
    precipitation: {
      amount: 1.0,
      type: PRECI_TYPE.blizzard
    },
    sun: {
      amount: 0.1
    },
    humidity: 10
  })
})

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
  SceneWeather.registerWeatherTemplate(MODULE.ID, 'frigid', {
    name: 'templates.weather.frigid.name',
    temp: {
      ground: -5,
      air: -20,
      percieved: -25
    },
    wind: {
      speed: 30,
      gusts: 35,
      direction: 70
    },
    clouds: {
      coverage: 0,
      bottom: 0,
      top: 0,
      type: CLOUD_TYPE.none
    },
    precipitation: {
      amount: 0,
      type: PRECI_TYPE.none
    },
    sun: {
      amount: 0.6
    },
    humidity: 10
  })
})

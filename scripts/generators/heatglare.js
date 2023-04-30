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

import { Utils } from '../utils.js'
import { EVENTS } from '../constants.js'
import { ColorFilter } from './colorFilter.js'

Hooks.on(EVENTS.REG_FX_FILTERS, async () => {
  SceneWeather.registerWeatherFxFilter('heatglare', function (modelData) {
    let filterConfigs = {}

    if (modelData.sun.amount > 0.8 && modelData.temp.air > 30) {
      filterConfigs['heatglare'] = {
        type: ColorFilter,
        tint: Utils.mapColorHex(modelData.sun.amount, 0.8, 1.0, '#ffffff', '#FFF3D1'),
        saturation: 1,
        gamma: 1,
        brightness: Utils.map(modelData.sun.amount, 0.8, 1.0, 1.0, 1.4),
        contrast: Utils.map(modelData.temp.air, 30, 50, 1.0, 1.5)
      }
    }

    return filterConfigs
  })
})

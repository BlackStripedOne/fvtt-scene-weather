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
  SceneWeather.registerWeatherFxFilter('freeze', function (modelData) {
    let filterConfigs = {}

    if (modelData.temp.air < 0) {
      filterConfigs['freeze'] = {
        type: ColorFilter,
        tint: Utils.mapColorHex(modelData.temp.air + 10, 0, 10, '#E1F3FE', '#FFFFFF'),
        saturation: 1.0 - Utils.map(modelData.temp.air + 10, 10, 0, 0, 0.4),
        gamma: 1,
        brightness: 1,
        contrast: 1
      }
    }

    return filterConfigs
  })
})

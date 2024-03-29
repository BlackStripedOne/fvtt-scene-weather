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
import { EVENTS, CLOUD_TYPE, PRECI_TYPE } from '../constants.js'
import { ColorFilter } from './colorFilter.js'
import { FlashFilter } from './flashFilter.js'

Hooks.on(EVENTS.REG_FX_FILTERS, async () => {
  SceneWeather.registerWeatherFxFilter('lightning', function (modelData) {
    let filterConfigs = {}

    if (
      modelData.clouds.type > CLOUD_TYPE.cumulus && // TCU
      [PRECI_TYPE.rain, PRECI_TYPE.downpour, PRECI_TYPE.hail].includes(
        modelData.precipitation.type
      ) && // RAIN, DOWNPOUR, HAIL
      modelData.precipitation.amount > 0.3
    ) {
      filterConfigs['lightning'] = {
        type: FlashFilter,
        frequency: 2000 - Utils.map(modelData.precipitation.amount, 0.3, 1.0, 0, 1600), // 2000 low intensity .. 800 high intensity
        duration: 100,
        brightness: 1.2
      }
      filterConfigs['cloudcolor'] = {
        type: ColorFilter,
        tint: '#D1CBD7',
        saturation: 1,
        gamma: 1,
        brightness: 1,
        contrast: 1
      }
    }

    return filterConfigs
  })
})

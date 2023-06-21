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

import { EVENTS } from '../constants.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { Utils } from '../utils.js'

Hooks.on(EVENTS.MODULE_READY, () => {
  // Show debugging toast only on log levels trace and debug
  if (Fal.isGm() && ['trace', 'debug'].includes(Fal.getSetting('loglevel', 'info'))) {
    canvas.sceneweather.debugToast = new DebugToast()
  }
})

/**
 * Debugging only, TOOD remove from module
 */
export class DebugToast {
  _debugToast = undefined

  _sections = {}

  constructor() {
    const sidebar = $('#sidebar')
    if (sidebar) {
      // eslint-disable-next-line quotes
      sidebar.after("<div id='sceneweatherdebug'></div>")
      this._debugToast = $('#sceneweatherdebug')
      this._debugToast.css({
        position: 'fixed',
        top: '10px',
        border: '1px solid white',
        background: 'rgba(0,0,0,0.2)',
        'border-radius': '4px',
        padding: '10px',
        'font-size': '10px',
        color: 'white',
        visibility: 'visible',
        'z-index': '31',
        'pointer-events': 'all'
      })
      this.setPosition(sidebar[0])
      Hooks.on('collapseSidebar', (sidebar) => {
        this.setPosition(sidebar.element[0])
      })
    }
  }

  setVisibile(visible) {
    if (!this._debugToast) return
    if (visible) {
      this._debugToast.css('visibility', 'visible')
    } else {
      this._debugToast.css('visibility', 'hidden')
    }
  }

  setPosition(element) {
    if (!this._debugToast) return
    const { width } = element.getBoundingClientRect()
    if (width) {
      this._debugToast.css('right', width + 40 + 'px')
    }
  }

  setDebugData(section, data) {
    this._sections[section] = data
    this._updateDebugWindow()
  }

  _updateDebugWindow() {
    if (!this._debugToast) return

    const data = this._sections['sfx']
    let html = 't:' + Math.round(data.tick)
    html += '</br>v:' + data.globalVolume
    html += '</br>s:' + data.sfxVolume
    html += '<ul>'
    for (const sfxId of Object.keys(data.sfx)) {
      const sfx = data.sfx[sfxId]
      const offset = sfx.sound.currentTime || 0
      html += '<li>' + sfxId + ' / ' + sfx.gain.toFixed(3) + ' / ' + offset.toFixed(1) + '</li>'
    }
    html += '</ul>'
    html += '<hr>'

    html += '<ul>'
    const ambience = Utils.flattenObject(this._sections['ambience'] || {})
    for (const ambienceKey of Object.keys(ambience)) {
      const ambienceValue = ambience[ambienceKey]
      html += '<li>' + ambienceKey + ' / ' + ambienceValue + '</li>'
    }
    html += '</ul>'

    this._debugToast.html(html)
  }
}

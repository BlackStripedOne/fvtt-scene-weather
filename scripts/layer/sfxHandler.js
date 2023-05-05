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
import { Utils, Logger } from '../utils.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.MODULE_READY, () => {
  Logger.debug('->Hook:MODULE_INITIALIZED  -> (creating SFX)')
  if (!canvas.sceneweather.sfxHandler) {
    const sfxHandler = new SfxHandler()
    canvas.sceneweather.sfxHandler = sfxHandler
    Hooks.callAll(EVENTS.REG_WEATHER_SFX, sfxHandler)
  }

  Hooks.on('globalAmbientVolumeChanged', async (volume) => {
    Logger.debug('->Hook:globalAmbientVolumeChanged  -> (...)', { volume: volume })
    if (canvas.sceneweather.sfxHandler) {
      canvas.sceneweather.sfxHandler.setGlobalVolume(volume)
    }
  })

  Hooks.on(EVENTS.SETTINGS_UPDATED, (changes) => {
    if (changes.id === 'sfxVolume') {
      Logger.debug('->Hook:sceneWeather,sfxVolumeChanged  -> (...)', {
        volume: changes.value / 100
      })
      canvas.sceneweather.sfxHandler.setSfxVolume(changes.value / 100)
    }
  })
})

/**
 * Class representing the sound effects handler. This class handles sound mixing and gain control by itself based and filterable and registered sfxs.
 * Register an effect via the SfxHandler.registerSfx method that automatically controls the sfx based on the ambience model of a selected token.
 */
export class SfxHandler {
  /**
   * Current systick frames for keeping track of consistent fades
   * @type {number}
   */
  _sysTick = 0

  /**
   * Registered sound effects to the sound handler.
   * @type {Array[object]}
   */
  _soundEffects = {}

  /**
   * Global volume setting. Can be set via the .setGlobalVolume function.
   * @type {number} in range 0.0 to 1.0
   */
  _globalVolume = 1.0

  /**
   * SceneWeather sound effects volume setting. Can be set via the .setSfxVolume function.
   * @type {number} in range 0.0 to 1.0
   */
  _sfxVolume = 1.0

  /**
   * Internal frag for marking volumes being changed, so they need to be recalculated.
   * @type {boolean}
   */
  _volumesChanged = true

  /**
   * Create a SfxHandler instance, registering the ticker as well as setting
   * the initial values for the set sound volumes.
   */
  constructor() {
    canvas.app.ticker.add(this.tick, this)
    // set volumes
    this._globalVolume = game.settings.get('core', 'globalAmbientVolume') || 1.0
    this._sfxVolume = Fal.getSetting('sfxVolume', 100) / 100
  }

  /*--------------------- Functions, public --------------------- */

  /**
   * Register sound effects.
   * @param {string} id - The identifier of the sound effect.
   * @param {string} source - The source of the sound effect.
   * @param {Object} options - The sound effect options.
   */
  registerSfx(id, source, options) {
    const sound = game.audio.create({
      src: source,
      singleton: true,
      preload: true,
      autoplay: false,
      autoplayOptions: {}
    })
    this._soundEffects[id] = {
      options: options,
      sound: sound,
      gain: 0.0,
      active: false,
      offset: 0,
      targetGain: 1.0,
      targetFrame: -1
    }
    sound.load().then((value) => {
      Logger.trace('SfxHandler.preloadSound(...) loaded', { id: id, value: value })
    })
    Logger.info('registerSfx | ' + Fal.i18n('api.regSfx') + id + '.')
  }

  /**
   * Disable all sound effects.
   * @param {boolean} [soft=false] - Softly disable all sound effects, by fading them out over time.
   */
  disableAllSounds(soft = false) {
    Object.values(this._soundEffects).forEach((sfx) => {
      sfx.targetFrame = -1
      sfx.sourceFrame = -1
      sfx.gain = 0.0
    })
    this._volumesChanged = true
    this._updateVolumes(soft)
  }

  /**
   * Update sound effects based on the ambience model.
   * @param {Object} ambienceModel - The ambience model.
   * @param {boolean} [soft=true] - Softly update the sound effects, by fading them out over time.
   */
  updateSounds(ambienceModel, soft = true) {
    Object.keys(this._soundEffects).forEach((sfxId) => {
      const sfx = this._soundEffects[sfxId]
      const sfxOptions = sfx.options

      // Check for matches on options
      let matches = true
      const matchAny = sfxOptions.matchAny
      if (matchAny) {
        matches =
          matches &&
          Object.keys(matchAny).find((matcherKey) => {
            const matcherOptions = sfxOptions.matchAny[matcherKey]
            const matcherValue = Utils.getNestedLeaf(ambienceModel, matcherKey)
            return matcherOptions.includes(matcherValue)
          })
      }

      // if none matches, bail
      if (!matches) {
        this._setTargetGain(sfx, 0.0)
        return
      }

      // get values to use for processing
      const basePrecipitation = Utils.getNestedLeaf(ambienceModel, sfxOptions.baseValue)
      const actualPrecipitation = Utils.getNestedLeaf(ambienceModel, sfxOptions.actualValue)
      if (basePrecipitation == null || actualPrecipitation == null) {
        this._setTargetGain(sfx, 0.0)
        // Logger.trace('SfxHandler.updateSounds(' + sfxId + '):clouds -> no values')
        return
      }

      const condition = ambienceModel.condition || 0
      const blendGain = sfxOptions.gainMatrix[condition][0] || 0.0
      const baseGain = sfxOptions.gainMatrix[condition][1] || 0.0
      // Logger.trace('SfxHandler.updateSounds(' + sfxId + '):gainCalc', { 'ambienceModel': ambienceModel, 'condition': condition, 'blendGain': blendGain, 'baseGain': baseGain })
      const gain = Math.max(
        this._getGain(basePrecipitation, sfxOptions.baseGain) * blendGain,
        this._getGain(actualPrecipitation, sfxOptions.actualGain) * baseGain
      )
      this._setTargetGain(sfx, gain)
    })
    this._volumesChanged = true
    this._updateVolumes(soft)
  }

  /**
   * Ticker function for the sound effect handler.
   * @private
   * @param {number} timeElapsed - The time elapsed since the last call to this function.
   */
  tick(timeElapsed) {
    this._sysTick += timeElapsed
    this._updateVolumes()
    // update debugging information
    if (canvas.sceneweather.debugToast) {
      canvas.sceneweather.debugToast.setDebugData('sfx', {
        tick: this._sysTick,
        globalVolume: this._globalVolume.toFixed(3),
        sfxVolume: this._sfxVolume.toFixed(3),
        sfx: this._soundEffects
      })
    }
  }

  /**
   * Set the global volume.
   * @param {number} volume - The global volume in the range between 0.0 and 1.0
   */
  setGlobalVolume(volume) {
    this._globalVolume = volume
    this._updateVolumes()
  }

  /**
   * Set the sound effect volume.
   * @param {number} volume - The sound effect volume in the range between 0.0 and 1.0
   */
  setSfxVolume(volume) {
    this._sfxVolume = volume
    this._updateVolumes()
  }

  /*--------------------- Functions, private --------------------- */

  /**
   * Set the target gain of a sound effect.
   * @private
   * @param {Object} sfx - The sound effect.
   * @param {number} gain - The target gain of the sound effect.
   */
  _setTargetGain(sfx, targetGain, fadeDuration = 100) {
    if (fadeDuration > 0) {
      sfx.targetGain = targetGain
      sfx.sourceGain = sfx.gain
      sfx.targetFrame = this._sysTick + fadeDuration
      sfx.sourceFrame = this._sysTick
    } else {
      sfx.gain = targetGain
      sfx.targetFrame = -1
      sfx.sourceFrame = -1
      sfx.sourceGain = sfx.targetGain
    }
  }

  /**
   * Update the sound effects with the new volumes.
   * @private
   * @returns {void}
   */
  _updateSounds() {
    if (!this._volumesChanged) return
    Object.values(this._soundEffects).forEach((sfx) => {
      if (sfx.gain > 0.0) {
        // should play
        if (sfx.sound.loaded) {
          if (sfx.sound.playing) {
            sfx.sound.volume = sfx.gain * this._globalVolume * this._sfxVolume
          } else {
            sfx.sound.play({
              loop: true,
              offset: sfx.offset,
              volume: sfx.gain * this._globalVolume * this._sfxVolume,
              fade: 0
            })
          }
        } else {
          sfx.sound.load().then(() => {
            this._volumesChanged = true
          })
        }
      } else {
        // should not play
        if (sfx.sound.playing) {
          sfx.offset = sfx.sound.currentTime
          sfx.sound.pause()
        }
      }
    })
    this._volumesChanged = false
  }

  /**
   * Update the volumes of the sound effects.
   * @private
   * @param {boolean} [soft=false] - Softly update the sound effects.
   */
  _updateVolumes(soft = true) {
    Object.values(this._soundEffects).forEach((sfx) => {
      if (sfx.targetFrame > 0) {
        if (soft) {
          // fade to
          if (this._sysTick >= sfx.targetFrame) {
            sfx.gain = sfx.targetGain
            sfx.sourceFrame = -1
            sfx.targetFrame = -1
          } else {
            if (sfx.targetGain > sfx.sourceGain) {
              sfx.gain = Utils.map(
                this._sysTick,
                sfx.sourceFrame,
                sfx.targetFrame,
                sfx.sourceGain,
                sfx.targetGain
              )
            } else {
              sfx.gain = -Utils.map(
                this._sysTick,
                sfx.sourceFrame,
                sfx.targetFrame,
                -sfx.sourceGain,
                -sfx.targetGain
              )
            }
          }
        } else {
          sfx.gain = sfx.targetGain
          sfx.sourceFrame = -1
          sfx.targetFrame = -1
        }
      }
      if (sfx.active && sfx.sound.playing) {
        sfx.sound.volume = sfx.gain * this._globalVolume * this._sfxVolume
      }
    })
    this._volumesChanged = true
    this._updateSounds()
  }

  /**
   * Returns the gain value for a given intensity value using a lookup table of positions and gain values.
   * @param {number} intensity - The intensity value between 0.0 and 1.0 for which to find the gain value.
   * @param {Array<Object>} arr - An array of objects with position and gain properties, representing the lookup table.
   * @returns {number} The gain value for the given intensity value, based on the lookup table.
   */
  _getGain(intensity, arr) {
    let startIndex = 0
    let endIndex = arr.length - 1

    // Handle edge cases where the intensity value is outside of the range of the array
    if (intensity <= arr[startIndex].position) {
      return arr[startIndex].gain
    }
    if (intensity >= arr[endIndex].position) {
      return arr[endIndex].gain
    }

    // Binary search for the indices between which the intensity value is located
    while (startIndex < endIndex - 1) {
      const midIndex = Math.floor((startIndex + endIndex) / 2)
      const midPos = arr[midIndex].position
      if (intensity < midPos) {
        endIndex = midIndex
      } else if (intensity > midPos) {
        startIndex = midIndex
      } else {
        return arr[midIndex].gain
      }
    }
    return Utils.map(
      intensity,
      arr[startIndex].position,
      arr[endIndex].position,
      arr[startIndex].gain,
      arr[endIndex].gain
    )
  }
}

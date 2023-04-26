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

import { Logger, Utils } from './utils.js'
import { WeatherEffect } from './weatherFx.js'
import { MODULE, EVENTS } from './constants.js'
import { SceneWeatherState } from './state.js'
import { FoundryAbstractionLayer as Fal } from './fal.js'
import { WeatherNodeData } from './layer/weatherNodeData.js'
import { WeatherNodeMask } from './layer/weatherNodeMask.js'


Hooks.on(EVENTS.SETTINGS_UPDATED, async (data) => {
  Logger.trace('-> Hooks::SettingsUpdated -> WeatherEffectsLayer.draw*Effects', { 'data': data })
  if (['cloudsAlpha', 'precipitationAlpha', 'maxParticles', 'enableFx'].includes(data.id)) {
    // Update weather to update effects
    SceneWeather.updateWeather({ force: true })
  }
})

Hooks.on(EVENTS.WEATHER_DISABLED, async (data) => {
  if (canvas.scene._id != data.scene.id) {
    Logger.trace('WeatherDisabled for another scene, ignoring')
    return
  }
  if (canvas['sceneweatherfx'] !== undefined) {
    await Promise.all([canvas.sceneweatherfx.drawParticleEffects({ 'soft': false }),
    canvas.sceneweatherfx.drawFilterEffects({ 'soft': false })])
  } else {
    Logger.trace('No canvas.sceneweatherfx') // Should not come to this.
  }
})

Hooks.on(EVENTS.WEATHER_UPDATED, async (data) => {
  Logger.debug('-> Hooks::WeatherUpdated -> WeatherEffectsLayer.draw*Effects', { 'data': data })

  if (canvas['sceneweatherfx'] !== undefined) {
    await Promise.all([canvas.sceneweatherfx.drawParticleEffects({
      'soft': !data.force,
      'data': data
    }),
    canvas.sceneweatherfx.drawFilterEffects({
      'soft': !data.force,
      'data': data
    })])
  } else {
    Logger.debug('No canvas.sceneweatherfx') // Should not come to this.
  }

})

/*
In favor of using updateScene Hook in init.js
Hooks.on('updateWeatherNodes', async (data) => {
  Logger.trace('-> Hooks::updateWeatherNodes Call updateWeatherMask', {'data':data})
  // await canvas.sceneweatherfx.updateWeatherMask()
})*/


export class WeatherEffectsLayer extends CanvasLayer {

  /**
   * Container for particle effects overlay
   * 
   * @type {PIXI.Container | undefined}
   */
  particleEffectsContainer

  /**
   * Sprite containing the weather effects masking texture.
   * 
   * @type {PIXI.Sprite}
   */
  spriteMask

  /**
   * List of currently active instances of WeatherEffect. Used for asynchronously keeping track of stopping and destroying effects
   * 
   * @type {WeatherEffect | []}
   */
  activeEffects = []

  /**
   * List of currently active instances of PIXI.filters.AdjustmentFilter. Used for asynchronously keeping track of stopping and destroying filters
   * 
   * @type {PIXI.filters.AdjustmentFilter | {}}
   */
  activeFilters = {}

  /**
   * Construct new scene weather effect layer as well as register it to the game ticker
   */
  constructor() {
    super()
    canvas.app.ticker.add(this.handleTick, this)
  }


  async updateWeatherMask() {
    // draw all masking elements
    let weatherMask = new PIXI.Container()

    // add scene mask to particle mask
    const sceneMask = weatherMask.addChild(new PIXI.LegacyGraphics())
    await sceneMask
      .clear()
      // mask canvas in blue    
      .beginFill(0x0000ff)
      .drawShape(canvas.dimensions.rect)
      .endFill()
      // mask scene in red
      .beginFill(0xff0000)
      .drawShape(canvas.dimensions.sceneRect.intersection(canvas.dimensions.rect))
      .endFill()
    // basically set the "image" invisible to the renderer
    sceneMask.mask = new PIXI.MaskData()


    const promises = WeatherNodeData.loadAll().map(nodeData => {
      // const weatherNode = new WeatherNode(nodeData)
      // return weatherMask.addChild(weatherNode).drawMask()

      const weatherNodeMask = new WeatherNodeMask(nodeData)
      return weatherMask.addChild(weatherNodeMask).draw()
    })
    await Promise.all(promises)



    // remove previously existing masks
    if (this.spriteMask) {

      this.removeChild(this.spriteMask)
      delete this.spriteMask
    }
    // render composite mask    
    const weatherMaskTexture = await canvas.app.renderer.generateTexture(weatherMask)
    this.spriteMask = this.addChild(new PIXI.Sprite(weatherMaskTexture))

    // set sprite mask to sceneweatherfx container
    this.mask = this.spriteMask
  }

  /**
    * TODO
    */
  static getFxFiltersForModel(modelData) {
    // TODO check for correct modelData content
    let filterConfigs = {}
    SceneWeatherState._filters.forEach(filter => {
      Utils.mergeObject(filterConfigs, filter.getFilterConfig(modelData))
    })
    Logger.debug('WeatherEffectsLayer.getFxFiltersForModel()', { 'model': modelData, 'filter': filterConfigs })
    return filterConfigs
  }

  /**
   * Define an elevation property on the ParticleEffectsLayer layer.
   * Render SceneWeather Effects above default weather effects from foundry.
   * 
   * @type {number}
   */
  get elevation() { return (canvas.weather?.elevation ?? 9999) + 1 }
  set elevation(value) {
    const weatherEffects = canvas.weather
    if (weatherEffects) {
      weatherEffects.elevation = value - 1
    }
  }

  /**
   * Return default layer options
   */
  static get layerOptions() {
    return Utils.mergeObject(super.layerOptions, {
      name: "weather-particle-effects",
      zIndex: 479
    })
  }

  /**
   * Draw this layer. All drawing will be handled via the draw*Effects methods.
   */
  async _draw() {
    Logger.trace('WeatherEffectsLayer._draw()', { 'this': this })


    // render all weathernode masks to particle mask
    this.updateWeatherMask()


    // TODO apply mask to filters
    // TODO maybe use one of    
    // -> https://api.pixijs.io/@pixi/picture/MaskFilter.html
    // -> canvas.environment.mask = canvas.sceneweatherfx.particleMask
    // -> VisualEffectsMaskingFilter
    // -> canvas.effects.coloration.mask
    /*const weatherOcclusionFilter = InverseOcclusionMaskFilter.create({
     alphaOcclusion: 1,
     uMaskSampler: canvas.sceneweatherfx.particleMask,
     channel: "b"
    })
    canvas.sceneweatherfx.filter = weatherOcclusionFilter*/

  }

  /**
   * Tears down this layer and stopps all emitters and filters
   * 
   * @returns 
   */
  async _tearDown() {
    Logger.debug('WeatherEffectsLayer._tearDown()', { 'effects': this.activeEffects })
    // remove all filtes from canvas layer
    const activeFilters = Object.values(this.activeFilters)
    const filterContainer = canvas.environment
    filterContainer.filters = filterContainer.filters?.filter(function (objFromA) {
      return !activeFilters.find(function (objFromB) {
        return objFromA === objFromB
      })
    }) ?? []
    this.activeEffects.forEach((effect => {
      effect.destroy()
    }))
    this.activeEffects = []
    this.particleEffectsContainer = undefined
    return super._tearDown()
  }

  /**
   * Called game by ticker 
   */
  handleTick() {
    for (const key in this.activeFilters) {
      this.activeFilters[key].step()
    }
  }

  /**
   * Asynchronously draws filter effects on the canvas environment layer based on the given options.
   * @async
   * @param {object} options - The options object.
   * @param {boolean} [options.soft=false] - Whether the filter effects should be "soft" faded out.
   * @param {object} [options.data] - The data object containing the model information.
   * @param {object} [options.data.model] - The model to use for retrieving filter configurations.
   */
  async drawFilterEffects(options) {
    Logger.debug('WeatherEffectsLayer.drawFilterEffects(...)', { 'options': options })
    const filterContainer = canvas.environment

    options = Utils.mergeObject({ 'soft': false }, options)
    if (!canvas.scene) return

    // Stop all existing filters
    const promises = Object.values(this.activeFilters).map((filter) => filter.destroy())
    await Promise.all(promises)

    // remove stopped filtes from canvas layer
    const activeFilters = Object.values(this.activeFilters)
    filterContainer.filters = filterContainer.filters?.filter(function (objFromA) {
      return !activeFilters.find(function (objFromB) {
        return objFromA === objFromB
      })
    }) ?? []
    this.activeFilters = {}

    if (!Fal.getSetting('enableFx', true)) return

    // Get and initialize filters
    if (options['data'] === undefined || options.data['model'] === undefined) {
      Logger.debug('WeatherEffectsLayer.drawFilterEffects() no model data contained, no filters.')
      return
    }
    const filterConfigs = WeatherEffectsLayer.getFxFiltersForModel(options.data.model)
    Object.entries(filterConfigs).map(([id, config]) => {
      this.activeFilters[id] = new config.type({
        'soft': options.soft,
        'options': Utils.mergeObject(config, { "-=type": null }, { performDeletions: true })
      })
      filterContainer.filters.push(this.activeFilters[id])
    })
  }

  /**
   * Asynchronously draws particle effects on the canvas environment layer based on the given options.
   * @async
   * @param {object} options - The options for the particles to add to the scene.
   * @param {boolean} [options.soft=false] - Whether the particle effects should be "soft"-eased out.
   */
  async drawParticleEffects(options) {
    options = Utils.mergeObject({ 'soft': false }, options)

    if (!canvas.scene) return
    if (!this.particleEffectsContainer) {
      this.particleEffectsContainer = this.addChild(new PIXI.Container())
    }

    const stopPromise = Promise.all(this.activeEffects.map(async (effect) => {
      if (options.soft) {
        await effect.softStop({ gracePeriod: 10 }) // Give 30s grace period for particles to die by themselves. Clouds will take longest.
      } else {
        effect.destroy()
        effect.stop()
      }
      // Remove stopped effect from list of active effects
      const index = this.activeEffects.indexOf(effect)
      if (index > -1) { // only splice array when effect is found
        this.activeEffects.splice(index, 1)
      }
    }))

    if (Fal.getSetting('enableFx', true)) {
      const newEffect = new WeatherEffect(this.particleEffectsContainer, options)
      newEffect.play({ easeIn: options.soft })
      this.activeEffects.push(newEffect)
    }

    Logger.debug('waiting for emitters to clean up (softly)', { 'effects': this.activeEffects, 'soft': options.soft })
    await stopPromise
    Logger.debug('cleaned up emitters', { 'effects': this.activeEffects })
  }
}

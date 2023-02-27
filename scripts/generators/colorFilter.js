export class ColorFilter extends PIXI.filters.AdjustmentFilter {

  /**
   * Create a color adjustment filter based on the PIXI AdjustmentFilter
   * @see https://api.pixijs.io/@pixi/core/PIXI/Filter.html
   * 
   * @param {object} optional parameters to overwrite and configure the filter
   */
  constructor({ options = {}, soft = false } = {}) {
    super()
    const { color, ...otherOptions } = foundry.utils.mergeObject({
      tint: '#ffffff',
      saturation: 1,
      gamma: 1,
      brightness: 1,
      contrast: 1
    }, options)
    const { r: red, g: green, b: blue } = foundry.utils.Color.from(options.tint)
    const newOptions = { ...otherOptions, red, green, blue }
    const keys = Object.keys(newOptions)
    for (const key of keys) {
      this.optionContext[key] = newOptions[key]
    }
    this.enabled = true
  }

  /**
   * The context on which options should be applied.
   */
  get optionContext() {
    return this
  }

  /**
   * Stop and destroy this filter.  
   */
  async destroy() {
    this.enabled = false
    return true
  }

  /**
   * No animation for this filter
   */
  async step() { }
}

import { Logger, Utils } from './utils.js'

/**
 * @see https://foundryvtt.com/api/classes/client.ParticleEffect.html
 * @see https://github.com/pixijs/particle-emitter/blob/d82acc7d920519fac3f4f55b7cb2b6236e31335e/src/Particle.ts
 */
export class WeatherEffect extends ParticleEffect {

  /**
   * A human-readable label for the weather effect. This can be a localization string
   */
  static label = "sceneweather.fxname"

  /**
   * Begin animation for the configured emitters
   * 
   * @param {*} object may contain optional bool easeIn for making the effect slowly ease in
   */
  play({ easeIn = true } = {}) {
    if (!easeIn) {
      this.emitters.forEach((emitter) => {
        emitter.autoUpdate = false
        emitter.emit = true
        emitter.update(emitter.maxLifetime)
        emitter.autoUpdate = true
      })
    }
    super.play()
  }

  /**
   * Get the particle emitters which should be active for this particle effect
   * 
   * @param {object} options emitter options
   * @returns Emitter[]
   */
  getParticleEmitters(options = {}) {
    // TODO only when user has weather effects allowed via settings
    const emitterConfigs = game.sceneWeather.get().getSceneWeatherFxEmitters()
    let emitters = []
    // TODO order of effects ( z-ordering )
    emitterConfigs.forEach(emitterConfig => {
      emitters.push(this.createEmitter(emitterConfig))
    })
    return emitters
  }

  /**
   * Fade this effect out for a given amount of second before stopping it
   * 
   * @param {object} may contain the optional number gracePeriod in seconds to give the emitter time to fade out
   * @returns {Promise<void>} a promise that resolves as soon as this emitter has finished
   */
  async softStop({ gracePeriod } = {}) {
    const emitterPromises = this.emitters.map(
      (emitter) =>
        new Promise((resolve) => {
          // Decimate active particles
          let particle = emitter._activeParticlesFirst
          while (particle != null) {
            const timeLeft = gracePeriod
            const currentTime = Math.max(particle.age, particle.maxLife - timeLeft)
            particle.age = currentTime
            particle.agePercent = particle.age * particle.oneOverLife
            particle = particle.next
          }
          // See https://pixijs.io/particle-emitter/docs/classes/Emitter.html#playOnceAndDestroy          
          emitter.emitterLifetime = 0
          emitter.playOnceAndDestroy(() => {
            resolve()
          })
        })
    )
    const promises = [Promise.all(emitterPromises)]
    if (gracePeriod !== undefined) {
      promises.push(
        new Promise(
          (resolve) => setTimeout(resolve, gracePeriod * 1000)
        ).then(
          this.destroy.bind(this)
        )
      )
    }
    await Promise.race(promises)
    this.stop()
  }
}
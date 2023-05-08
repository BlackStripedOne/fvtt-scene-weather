import { FoundryAbstractionLayer as Fal } from '../../scripts/fal.js'
import { MODULE } from '../../scripts/constants.js'

describe('Fal.getSetting()', () => {
  let gameSettingsGetMock

  beforeEach(() => {
    gameSettingsGetMock = jest.spyOn(game.settings, 'get').mockImplementation(() => null)
    // Set up a spy on the game.settings.get() method, which returns null by default
  })

  afterEach(() => {
    gameSettingsGetMock.mockRestore()
    // Restore the original implementation of game.settings.get() after each test
  })

  it('returns the null value when the key is not found', () => {
    const defaultValue = null
    const result = Fal.getSetting('nonexistent-key', defaultValue)
    expect(game.settings.get).toHaveBeenCalledWith(MODULE.ID, 'nonexistent-key')
    expect(result).toEqual(defaultValue)
  })

  it('returns the value of the specified key when it exists', () => {
    const expectedValue = 'test-value'
    gameSettingsGetMock.mockImplementation(() => expectedValue)
    const result = Fal.getSetting('existing-key', 'default')
    expect(game.settings.get).toHaveBeenCalledWith(MODULE.ID, 'existing-key')
    expect(result).toEqual(expectedValue)
  })
})

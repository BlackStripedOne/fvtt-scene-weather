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

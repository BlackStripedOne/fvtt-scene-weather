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

import { DEFAULT_FOUNDRY_10_VERSION } from './constants'

globalThis.getType = function (variable) {
  // Primitive types, handled with simple typeof check
  const typeOf = typeof variable
  if (typeOf !== 'object') return typeOf

  // Special cases of object
  if (variable === null) return 'null'
  if (!variable.constructor) return 'Object' // Object with the null prototype.
  if (variable.constructor.name === 'Object') return 'Object' // simple objects

  // Match prototype instances
  const prototypes = [
    [Array, 'Array'],
    [Set, 'Set'],
    [Map, 'Map'],
    [Promise, 'Promise'],
    [Error, 'Error'],
    [Color, 'number']
  ]
  if ('HTMLElement' in globalThis) prototypes.push([globalThis.HTMLElement, 'HTMLElement'])
  for (const [cls, type] of prototypes) {
    if (variable instanceof cls) return type
  }

  // Unknown Object type
  return 'Object'
}

globalThis.canvas = {
  scene: {
    setFlag: jest.fn()
  },
  app: {
    ticker: {
      maxFPS: 60
    }
  }
}

// @ts-ignore - Mocking for Foundry
globalThis.Hooks = {
  once: jest.fn(),
  on: jest.fn(),
  callAll: jest.fn()
}

// @ts-ignore - Mocking for Foundry
globalThis.game = {
  modules: new Map(),
  i18n: {
    localize: jest.fn().mockImplementation((id) => {
      return id
    })
  },
  settings: {
    get: jest.fn(),
    set: jest.fn(),
    register: jest.fn(),
    registerMenu: jest.fn()
  },
  user: {
    isGM: jest.fn()
  },
  version: DEFAULT_FOUNDRY_10_VERSION
}

// @ts-ignore - Mocking for Foundry
globalThis.ui = {
  windows: jest.fn(),
  notifications: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}

// @ts-ignore - Mocking for Foundry
globalThis.FormApplication = class FormApplication {
  static DEFAULT_OPTIONS = {
    classes: ['form'],
    closeOnSubmit: true,
    editable: true,
    sheetConfig: false,
    submitOnChange: false,
    submitOnClose: false
  }

  static get defaultOptions() {
    return this.DEFAULT_OPTIONS
  }

  render() {}
}

globalThis.Application = class Application {
  static DEFAULT_OPTIONS = {
    classes: ['form'],
    closeOnSubmit: true,
    editable: true,
    sheetConfig: false,
    submitOnChange: false,
    submitOnClose: false
  }

  static get defaultOptions() {
    return this.DEFAULT_OPTIONS
  }

  render() {}
}

// @ts-ignore - Mocking for Foundry
globalThis.ModuleManagement = class ModuleManagement extends FormApplication {}

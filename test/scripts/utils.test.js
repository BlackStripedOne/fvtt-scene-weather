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

import { Utils } from '../../scripts/utils.js'

// Describe the test suite for the function
describe('Utils.getKeyByValue', () => {
  // Test case 1: Test when value is found in the object
  it('returns the correct key when value is found in the object', () => {
    // Define the test object
    const testObject = {
      a: 1,
      b: 2,
      c: 3
    }

    // Call the function with value that exists in the object
    const result = Utils.getKeyByValue(testObject, 2)

    // Assert that the function returns the correct key
    expect(result).toBe('b')
  })

  // Test case 2: Test when value is not found in the object
  it('returns the default value when value is not found in the object', () => {
    // Define the test object
    const testObject = {
      a: 1,
      b: 2,
      c: 3
    }

    // Call the function with value that does not exist in the object
    const result = Utils.getKeyByValue(testObject, 4, 'default')

    // Assert that the function returns the default value
    expect(result).toBe('default')
  })

  // Test case 3: Test when default value is not provided
  it('returns null when default value is not provided and value is not found in the object', () => {
    // Define the test object
    const testObject = {
      a: 1,
      b: 2,
      c: 3
    }

    // Call the function with value that does not exist in the object and no default value
    const result = Utils.getKeyByValue(testObject, 4)

    // Assert that the function returns null
    expect(result).toBeNull()
  })

  // Test case 4: Test when object is empty
  it('returns null when object is empty', () => {
    // Define an empty object
    const testObject = {}

    // Call the function with any value and default value
    const result = Utils.getKeyByValue(testObject, 'any')

    // Assert that the function returns null
    expect(result).toBeNull()
  })

  // Test case 5: Test when value is not provided
  it('returns null when value is not provided', () => {
    // Define the test object
    const testObject = {
      a: 1,
      b: 2,
      c: 3
    }

    // Call the function without value and with default value
    const result = Utils.getKeyByValue(testObject)

    // Assert that the function returns null
    expect(result).toBeNull()
  })
})

describe('Utils.getNestedLeaf', () => {
  // Test 1
  test('returns undefined for invalid path', () => {
    const obj = { a: { b: { c: 1 } } }
    const str = 'a.d'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBeUndefined()
  })

  // Test 2
  test('returns root object for empty path', () => {
    const obj = { a: { b: { c: 1 } } }
    const str = ''
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBe(obj)
  })

  // Test 3
  test('returns leaf value for valid path', () => {
    const obj = { a: { b: { c: 1 } } }
    const str = 'a.b.c'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBe(1)
  })

  // Test 4
  test('returns undefined for invalid path with null object', () => {
    const obj = null
    const str = 'a.b.c'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBeUndefined()
  })

  // Test 5
  test('returns undefined for invalid path with undefined object', () => {
    const obj = undefined
    const str = 'a.b.c'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBeUndefined()
  })

  // Test 6
  test('returns undefined for invalid path with non-object value', () => {
    const obj = 123
    const str = 'a.b.c'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBeUndefined()
  })

  // Test 7
  test('returns nested leaf for multi-level path', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: 123
              }
            }
          }
        }
      }
    }
    const str = 'a.b.c.d.e.f'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBe(123)
  })

  // Test 8
  test('returns leaf value for single-level path', () => {
    const obj = { a: 123 }
    const str = 'a'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toBe(123)
  })

  // Test 9
  test('returns nested object for path to object', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: 123
              }
            }
          }
        }
      }
    }
    const str = 'a.b.c.d.e'
    const result = Utils.getNestedLeaf(obj, str)
    expect(result).toEqual({ f: 123 })
  })
})

describe('Utils.throttleInteractivity', () => {
  let instance

  beforeEach(() => {
    instance = {
      _drawTime: null
    }
  })

  it('should return true when called within the throttle rate', () => {
    const sampleRate = Math.ceil(1000 / 60)
    instance._drawTime = Date.now() - sampleRate + 1
    expect(Utils.throttleInteractivity(instance)).toBe(true)
  })

  it('should return false when called outside the throttle rate', () => {
    const sampleRate = Math.ceil(1000 / 60)
    instance._drawTime = Date.now() - sampleRate - 1
    expect(Utils.throttleInteractivity(instance)).toBe(false)
  })

  it('should set the _drawTime property to the current time when called', () => {
    Utils.throttleInteractivity(instance)
    const previousTime = instance._drawTime
    Utils.throttleInteractivity(instance)
    expect(instance._drawTime).toBeGreaterThanOrEqual(previousTime)
  })
})

describe('Utils.getSeedFromString', () => {
  it('should return 0 for an empty string', () => {
    const result = Utils.getSeedFromString('')
    expect(result).toBe(0)
  })

  it('should return a non-negative integer for a non-empty string', () => {
    const result = Utils.getSeedFromString('hello world')
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('should return the same value for the same input string', () => {
    const str = 'hello world'
    const result1 = Utils.getSeedFromString(str)
    const result2 = Utils.getSeedFromString(str)
    expect(result1).toEqual(result2)
  })

  it('should return different values for different input strings', () => {
    const str1 = 'hello world'
    const str2 = 'goodbye world'
    const result1 = Utils.getSeedFromString(str1)
    const result2 = Utils.getSeedFromString(str2)
    expect(result1).not.toEqual(result2)
  })
})

describe('Utils.objectsEqual', () => {
  it('should return true when two objects are equal', () => {
    const obj1 = { a: 1, b: { c: 2 } }
    const obj2 = { a: 1, b: { c: 2 } }
    expect(Utils.objectsEqual(obj1, obj2)).toBe(true)
  })

  it('should return false when two objects are not equal', () => {
    const obj1 = { a: 1, b: { c: 2 } }
    const obj2 = { a: 1, b: { c: 3 } }
    expect(Utils.objectsEqual(obj1, obj2)).toBe(false)
  })

  it('should return false when one of the objects is undefined', () => {
    const obj1 = { a: 1, b: { c: 2 } }
    const obj2 = undefined
    expect(Utils.objectsEqual(obj1, obj2)).toBe(false)
  })

  it('should return true when both objects are null', () => {
    const obj1 = null
    const obj2 = null
    expect(Utils.objectsEqual(obj1, obj2)).toBe(true)
  })

  it('should return false when one of the objects is null and the other is not', () => {
    const obj1 = null
    const obj2 = { a: 1, b: { c: 2 } }
    expect(Utils.objectsEqual(obj1, obj2)).toBe(false)
  })
})

describe('Utils.mergeObject()', () => {
  test('should throw an error when either original or other is not an object', () => {
    expect(() => Utils.mergeObject(null, {})).toThrow()
    expect(() => Utils.mergeObject(undefined, null)).toThrow()
  })

  test('should merge two objects correctly with default options', () => {
    const original = { a: 1, b: 2 }
    const other = { b: 3, c: 4 }
    const expected = { a: 1, b: 3, c: 4 }
    const result = Utils.mergeObject(original, other)
    expect(result).toEqual(expected)
  })

  test('should merge two objects recursively with options', () => {
    const original = { a: { b: 1 }, c: [2] }
    const other = { a: { c: 3 }, d: 4 }
    const options = {
      recursive: true,
      insertValues: true,
      overwrite: true,
      inplace: true
    }
    const expected = { a: { b: 1, c: 3 }, c: [2], d: 4 }
    const result = Utils.mergeObject(original, other, options)
    expect(result).toEqual(expected)
  })

  test('should expand dot notation keys with options', () => {
    const original = { 'a.b': 1 }
    const other = { 'a.c': 2 }
    const options = {
      expand: true,
      inplace: false
    }
    const expected = { a: { b: 1, c: 2 } }
    const result = Utils.mergeObject(original, other, options)
    expect(result).toEqual(expected)
  })
})

describe('Utils.expandObject', () => {
  test('should expand all object keys', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      }
    }
    const expected = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      }
    }
    expect(Utils.expandObject(obj)).toEqual(expected)
  })

  test('should throw an error when maximum depth is exceeded', () => {
    const obj = {
      a: {
        b: {
          c: {}
        }
      }
    }
    expect(() => Utils.expandObject(obj, 100)).toThrow('Maximum object expansion depth exceeded')
  })
})

describe('Utils.setProperty', () => {
  test('should set a property on an object', () => {
    const obj = { foo: 'bar' }
    const key = 'baz'
    const value = 42

    const changed = Utils.setProperty(obj, key, value)

    expect(changed).toBe(true)
    expect(obj).toEqual({ foo: 'bar', baz: 42 })
  })

  test('should set a nested property on an object', () => {
    const obj = { foo: { bar: 'baz' } }
    const key = 'foo.bar'
    const value = 42

    const changed = Utils.setProperty(obj, key, value)

    expect(changed).toBe(true)
    expect(obj).toEqual({ foo: { bar: 42 } })
  })

  test('should not set a property if the value is the same', () => {
    const obj = { foo: 'bar' }
    const key = 'foo'
    const value = 'bar'

    const changed = Utils.setProperty(obj, key, value)

    expect(changed).toBe(false)
    expect(obj).toEqual({ foo: 'bar' })
  })
})

describe('arrayNext', () => {
  test('should return the next element in the array', () => {
    const arr = [1, 2, 3]
    expect(Utils.arrayNext(arr, 1)).toEqual(2)
    expect(Utils.arrayNext(arr, 2)).toEqual(3)
    expect(Utils.arrayNext(arr, 3)).toEqual(1)
  })

  test('should return the first element when current element is not found', () => {
    const arr = [1, 2, 3]
    expect(Utils.arrayNext(arr, 4)).toEqual(1)
  })

  test('should return the current element when array is empty', () => {
    expect(Utils.arrayNext([], 'test')).toEqual('test')
  })
})

describe('Utils.arrayPrev', () => {
  test('returns the previous element in the array', () => {
    const arr = ['a', 'b', 'c', 'd']
    expect(Utils.arrayPrev(arr, 'b')).toBe('a')
    expect(Utils.arrayPrev(arr, 'c')).toBe('b')
    expect(Utils.arrayPrev(arr, 'a')).toBe('d')
  })

  test('returns the first element if the current element is the first in the array', () => {
    const arr = ['a', 'b', 'c', 'd']
    expect(Utils.arrayPrev(arr, 'a')).toBe('d')
  })

  test('returns the current element if the array is empty', () => {
    expect(Utils.arrayPrev([], 'a')).toBe('a')
  })

  test('returns undefined if the array is empty and no current element is specified', () => {
    expect(Utils.arrayPrev()).toBe('')
  })
})

describe('Utils.clamp', () => {
  test('should return the input number if it is within the given range', () => {
    expect(Utils.clamp(5, 1, 10)).toBe(5)
  })

  test('should return the minimum value if the input number is less than the minimum', () => {
    expect(Utils.clamp(-5, 1, 10)).toBe(1)
  })

  test('should return the maximum value if the input number is greater than the maximum', () => {
    expect(Utils.clamp(15, 1, 10)).toBe(10)
  })

  test('should return the minimum value if the input number is equal to the minimum', () => {
    expect(Utils.clamp(1, 1, 10)).toBe(1)
  })

  test('should return the maximum value if the input number is equal to the maximum', () => {
    expect(Utils.clamp(10, 1, 10)).toBe(10)
  })

  test('should return NaN if any of the input values are NaN', () => {
    expect(Utils.clamp(Number.NaN, 1, 10)).toBeNaN()
    expect(Utils.clamp(5, Number.NaN, 10)).toBeNaN()
    expect(Utils.clamp(5, 1, Number.NaN)).toBeNaN()
  })
})

describe('Utils.map', () => {
  it('should map input values correctly', () => {
    expect(Utils.map(0, 0, 10, 0, 100)).toBe(0)
    expect(Utils.map(5, 0, 10, 0, 100)).toBe(50)
    expect(Utils.map(10, 0, 10, 0, 100)).toBe(100)
    expect(Utils.map(10, 10, 0, 0, 100)).toBe(0)
    expect(Utils.map(5, 10, 0, 0, 100)).toBe(50)
    expect(Utils.map(0, 10, 0, 0, 100)).toBe(100)
  })

  it('should clamp input values if necessary', () => {
    expect(Utils.map(-5, 0, 10, 0, 100)).toBe(0)
    expect(Utils.map(15, 0, 10, 0, 100)).toBe(100)
    expect(Utils.map(15, 10, 0, 0, 100)).toBe(0)
    expect(Utils.map(-5, 10, 0, 0, 100)).toBe(100)
  })
})

describe('Utils.omit', () => {
  test('should omit the specified key from the object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const key = 'b'
    const result = Utils.omit(obj, key)
    expect(result).toEqual({ a: 1, c: 3 })
  })

  test('should return a new object without modifying the original', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const key = 'b'
    const result = Utils.omit(obj, key)
    expect(result).toEqual({ a: 1, c: 3 })
    expect(obj).toEqual({ a: 1, b: 2, c: 3 })
  })

  test('should return the original object if the key is not found', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const key = 'd'
    const result = Utils.omit(obj, key)
    expect(result).toEqual(obj)
  })

  test('should return an empty object if the input object is empty', () => {
    const obj = {}
    const key = 'a'
    const result = Utils.omit(obj, key)
    expect(result).toEqual({})
  })
})

describe('Utils.roundToDecimals', () => {
  it('should round a number to the specified number of decimal places', () => {
    expect(Utils.roundToDecimals(3.141_59, 2)).toBe(3.14)
    expect(Utils.roundToDecimals(1.234_567_89, 4)).toBe(1.2346)
    expect(Utils.roundToDecimals(0.123_456_789, 6)).toBe(0.123_457)
  })

  it('should return NaN if the input is not a number', () => {
    expect(Utils.roundToDecimals('3,14159', 2)).toBeNaN()
    expect(Utils.roundToDecimals(null, 2)).toBeNaN()
    expect(Utils.roundToDecimals(undefined, 2)).toBeNaN()
  })
})

describe('Utils.isBitSet', () => {
  test('should return true if the bit is set', () => {
    expect(Utils.isBitSet(5, 0)).toBe(true)
    expect(Utils.isBitSet(5, 1)).toBe(false)
    expect(Utils.isBitSet(5, 2)).toBe(true)
  })

  test('should return false if the bit is not set', () => {
    expect(Utils.isBitSet(0, 0)).toBe(false)
    expect(Utils.isBitSet(1, 1)).toBe(false)
    expect(Utils.isBitSet(2, 0)).toBe(false)
  })
})

describe('Utils.deepClone', () => {
  test('should return a deep copy of the original object', () => {
    const original = {
      name: 'John',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA'
      },
      hobbies: ['reading', 'hiking', 'cooking'],
      birthday: new Date('1993-05-08')
    }
    const clone = Utils.deepClone(original)
    expect(clone).toEqual(original)
    expect(clone).not.toBe(original)
    expect(clone.address).toEqual(original.address)
    expect(clone.address).not.toBe(original.address)
    expect(clone.hobbies).toEqual(original.hobbies)
    expect(clone.hobbies).not.toBe(original.hobbies)
    expect(clone.birthday).toEqual(original.birthday)
    expect(clone.birthday).not.toBe(original.birthday)
  })

  test('should throw an error when trying to clone advanced objects in strict mode', () => {
    const original = new Map()
    expect(() => Utils.deepClone(original, { strict: true })).toThrow(
      'deepClone cannot clone advanced objects'
    )
  })

  test('should not throw an error when trying to clone advanced objects in non-strict mode', () => {
    const original = new Map()
    const clone = Utils.deepClone(original, { strict: false })
    expect(clone).toBe(original)
  })
})

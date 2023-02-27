/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.

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
import { MODULE } from './constants.js'

/**
 * Registers the special helper functions for switch-cases with multiple case statements and default. Switch blocks are nestable.
 * 
 * {{#switch variable}}
 *  {{#case 'value1' 'value2'}}value 1 or 2{{/case}}
 *  {{#case 'value3'}}value 3{{/case}}
 *  {{#default}}default value{{/default}}
 * {{/switch}}
 */
export const registerHbHelpers = function () {

  Handlebars.__switch_stack__ = []

  Handlebars.registerHelper("switch", function (value, options) {
    Handlebars.__switch_stack__.push({
      switch_match: false,
      switch_value: value
    })
    var html = options.fn(this)
    Handlebars.__switch_stack__.pop()
    return html
  })

  Handlebars.registerHelper("case", function (value, options) {
    var args = Array.from(arguments)
    var options = args.pop()
    var caseValues = args
    var stack = Handlebars.__switch_stack__[Handlebars.__switch_stack__.length - 1]

    if (stack.switch_match || caseValues.indexOf(stack.switch_value) === -1) {
      return ''
    } else {
      stack.switch_match = true
      return options.fn(this)
    }
  })

  Handlebars.registerHelper("default", function (options) {
    var stack = Handlebars.__switch_stack__[Handlebars.__switch_stack__.length - 1]
    if (!stack.switch_match) {
      return options.fn(this)
    }
  })

  Logger.debug('HB Helpers Registered')

} // registerHbHelpers

export const loadHandlebars = function () {
  // register templates parts  
  loadTemplates({
    'manualTime': 'modules/' + MODULE.ID + '/templates/manualTime.hbs',
    'manualSeason': 'modules/' + MODULE.ID + '/templates/manualSeason.hbs'
  });
  Logger.debug('HB partials loaded')

}

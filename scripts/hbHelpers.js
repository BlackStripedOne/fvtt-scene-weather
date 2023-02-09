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

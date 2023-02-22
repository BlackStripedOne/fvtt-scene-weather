import { Logger, Utils } from '../utils.js'
import { MODULE } from '../constants.js'
import { ColorFilter } from './colorFilter.js'

Hooks.on(MODULE.LCCNAME + 'RegisterFilters', async () => {
	Logger.debug('registered filter for heatglare')
	game.sceneWeather.filters.push({
		'name': 'heatglare',
		'getFilterConfig': function (modelData) {
			let filterConfigs = {}

			if (modelData.sun.amount > 0.8 &&
				modelData.temp.air > 30) {
				filterConfigs['heatglare'] = {
					type: ColorFilter,
					tint: Utils.mapColorHex(modelData.sun.amount, 0.8, 1.0, '#ffffff', '#FFF3D1'),
					saturation: 1,
					gamma: 1,
					brightness: Utils.map(modelData.sun.amount, 0.8, 1.0, 1.0, 1.4),
					contrast: Utils.map(modelData.temp.air, 30, 50, 1.0, 1.5)
				}
			}

			return filterConfigs
		}
	})
})

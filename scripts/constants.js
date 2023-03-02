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

/**
 * Module-based constants
 */
export const MODULE = {
  ID: 'scene-weather',
  NAME: 'Scene Weather',
  LCCNAME: 'sceneWeather'
}

export const GENERATOR_MODES = {
  'WEATHER_TEMPLATE': 'weatherTemplate', // Weather Template (Rainstorm, Thunder, Sunny Breeze, ...) / Time,Date agnostic, static
  'WEATHER_GENERATE': 'weatherAuto', // Weather from scene or global weatherConfig
  'REGION_TEMPLATE': 'regionTemplate', // Region Template (Boreal Forest, Shorelines, Mountains, ...) Time,Date aware
  'REGION_GENERATE': 'regionAuto', // Region Automatic (Temps, Moists, Winds, ...) Time,Date dependant
  'DISABLED': 'disabled'
}

export const EVENTS = {
  'SETTINGS_UPDATED': MODULE.LCCNAME + 'SettingsUpdated',
  'REG_TEMPLATE_REGION': MODULE.LCCNAME + 'RegisterRegionTemplate',
  'REG_TEMPLATE_WEATHER': MODULE.LCCNAME + 'RegisterWeatherTemplate'
}

export const METEO = {
  'isaMSLtempC': 16,  // default temperature for the ISA at mean sea level in degC
  'isaSeaLevelPa': 101325, // default air pressure for the ISA at mean sea level in Pa
  'adiabaticHyDryCoeff': -0.0065, // coefficient between dry adiabadic and hygro adiabatic cooling on ascent per meter altitude
  'g': 9.80665,
  'mAir': 0.0289644, // molar mass of Earth's air: 0.0289644 kg/mol
  'R': 8.3144598, // universal gas constant: 8.3144598 J/(mol·K)'
  'Tzero': 237.7 // saturation vapor pressure in Kelvin, over a flat surface of water
}

export const PRECI_TYPE = {
  'none': 0,
  'drizzle': 1,
  'rain': 2,
  'downpour': 3,
  'hail': 4,
  'snow': 5,
  'blizzard': 6
}

export const CLOUD_TYPE = {
  'none': 0,
  'fog': 1,
  'stratus': 2,
  'cumulus': 3,
  'cumulunimbus': 4
}

// percent 0..100
export const HUMIDITY_LEVELS = {
  'dry': 20,
  'comfortable': 40,
  'pleasant': 50,
  'sticky': 65,
  'humid': 75,
  'oppressive': Infinity
}

// percent 0.0..1.0
export const SUN_INTENSITY = {
  'gloomy': 0.1,
  'shaded': 0.3,
  'normal': 0.7,
  'bright': Infinity
}

// percent 0.0..1.0
export const PRECI_AMOUNT = {
  'nothing': 0.2,
  'slight': 0.4,
  'average': 0.7,
  'heavy': 0.95,
  'extreme': Infinity
}

// https://education.nationalgeographic.org/resource/beaufort-scale/
// km/h
export const WIND_SPEED = {
  'calm': 1,
  'light': 5,
  'lightBreeze': 11,
  'gentleBreeze': 28,
  'freshBreeze': 38,
  'strongBreeze': 49,
  'moderateGale': 61,
  'freshGale': 74,
  'strongGale': 88,
  'wholeGale': 102,
  'storm': 118,
  'hurricane': Infinity
}

export const CLOUD_HEIGHT = {
  'low': 600,
  'mid': 1000,
  'high': 4000,
  'veryhigh': Infinity
}

export const TEMP_TYPES = {
  'freezing': -7,
  'cold': -3,
  'chill': 3,
  'fresh': 7,
  'moderate': 18,
  'mild': 22,
  'warm': 30,
  'hot': 37,
  'searing': Infinity
}


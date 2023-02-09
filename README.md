![GitHub Latest Version](https://img.shields.io/github/v/release/BlackStripedOne/fvtt-scene-weather?sort=semver)
![GitHub Latest Release](https://img.shields.io/github/downloads/BlackStripedOne/fvtt-scene-weather/latest/module.zip)
![GitHub All Releases](https://img.shields.io/github/downloads/BlackStripedOne/fvtt-scene-weather/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fscene-weather)](https://forge-vtt.com/bazaar#package=scene-weather)
![Foundry min Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2FBlackStripedOne%2Ffvtt-scene-weather%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.minimum&colorB=orange)
![Foundry verified Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2FBlackStripedOne%2Ffvtt-scene-weather%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=green)


# Scene Weather

Controling weather for scenes from weather model up to weather effects, with an API to be used for game systems.

# Features
- Choose your complexity. Select your mode from:
  - Set predefined wether for a scene from a set of weather effects,
  - set a predefined biome to have the weather generated based on season and time of day,
  - individually set the scenes regional parameters to have the weather generated based on a model and the current season and time of day or
  - go completely manual by seeting and tweaking all mobs and dialy of the weather module for the scene manually.
- Render weather effects on the scene both visually and acoustically.
- Supplies an API to be used in your game system to have effects on tokens, and scene props.
- Show weather forecasts depending on a given time/date so you can plan how the weather will change for a scene.
- Manually set a given weather for a fixed time/date to match your story telling.
- Uses a detailed weather model to generate realistic weather.
- Integrates in existing time / date providers, like SimpleTime or SimpleCalendar.

# Installation

## Method 1
1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. Search for **Scene Weather** 
4. Click **Install** next to the module listing

## Method 2
1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. In the Manifest URL field, paste: `https://github.com/BlackStripedOne/fvtt-scene-weather/releases/latest/download/module.json`
4. Click **Install** next to the pasted Manifest URL

## Required Modules

Currently the tools are independant of other modules.

# Support

For questions, feature requests or bug reports, please open an issue [here](https://github.com/BlackStripedOne/fvtt-scene-weather/issues).

Pull requests are welcome. Please include a reason for the request or create an issue before starting one.

# Acknowledgements

Thanks to the Foundry VTT Developers to give us such an awesome platform to play our VTT on.

# License

This Foundry VTT module is licensed under a [Creative Commons Attribution Share Alike 4.0 International](https://choosealicense.com/licenses/cc-by-sa-4.0/) and this work is licensed under [Foundry Virtual Tabletop EULA - Limited License Agreement for module development](https://foundryvtt.com/article/license/).
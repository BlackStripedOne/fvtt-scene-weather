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

import { FoundryAbstractionLayer as Fal } from '../fal.js'
import { MODULE } from '../constants.js'
import { Logger, Utils } from '../utils.js'

Hooks.once('ready', () => {
  if (!Fal.isGm()) return
  const lastWelcomePromt = Fal.getSetting('welcomePrompt', '0.0.0')
  const currentModuleVersion = Fal.getModuleVersion()
  // show warning if foundry version is too old
  if (Fal.isNewerVersion(Fal.getModule().compatibility.verified, Fal.gameVersion)) {
    Logger.error(
      Fal.i18nf('sceneweather.foundryVersionCheck', {
        module: MODULE.NAME,
        minVersion: Fal.getModule().compatibility.verified,
        gameVersion: Fal.gameVersion
      }),
      true,
      true
    )
  }
  // show welcome/changelog dialog
  if (lastWelcomePromt != currentModuleVersion || currentModuleVersion == 'development') {
    const dialog = new WelcomeDialog(false)
    dialog.render(true)
  }
})

/**
 * Creates a dialog, welcoming the gamemaster to the newly installed module or a newer version of the module. Handles
 * discarding of the module as well as fetching of the changelogs of all versions available and past installed.
 */
export class WelcomeDialog extends FormApplication {

  /**
   * Flag, set via construcor wether this is for welcoming gms (false) or showing the whole version history (true)
   * @type {boolean}
   */
  _showAll = true

  /**
   * Creates a new welcome/changelog dialog, depending on the set flag.
   * @param {boolean} showAll Wether this is for welcoming gms (false) or showing the whole version history (true)
   */
  constructor(showAll = true) {
    super()
    this._showAll = showAll
  }

  /* --------------------- static ----------------------- */

  /** @override */
  static get defaultOptions() {
    return Utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: 'modules/' + MODULE.ID + '/templates/welcome.hbs',
      id: 'welcome-scene-weather',
      title: 'dialogs.welcome.title',
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    })
  }

  /* --------------------- Public functions ----------------------- */

  /**
   * Construct the data object to be used for filling the template.
   * @returns {Object} An object containing weather configuration data.
   */
  async getData() {
    const lastWelcomePromt = Fal.getSetting('welcomePrompt', '0.0.0')
    const currentModuleVersion = Fal.getModuleVersion()

    // get versions from repository
    let versions = await this._getReleaseVersions()
    let latestVersion = currentModuleVersion
    if (versions) {
      // filter only versions newer then lastWelcomePromt and as new as currentModuleVersion
      versions = versions.filter((version) => {
        if (Fal.isNewerVersion(version.version, latestVersion)) latestVersion = version.version
        return (
          this._showAll ||
          (Fal.isNewerVersion(version.version, lastWelcomePromt) &&
            !Fal.isNewerVersion(version.version, currentModuleVersion))
        )
      })
    }
    let data = {
      dontShowAgain: lastWelcomePromt == currentModuleVersion,
      isDevVersion: currentModuleVersion == 'development',
      isFirstTime: lastWelcomePromt == '0.0.0',
      changelog: versions || [],
      hasChangelog: !!(versions !== undefined),
      url: Fal.getModule().url,
      latestVersion: latestVersion,
      canUpdate: !(latestVersion == currentModuleVersion),
      currentVersion: currentModuleVersion,
      readmeUrl: Fal.getModule().readme,
      showAll: this._showAll
    }
    return data
  }

  /* --------------------- Private  functions ----------------------- */

  /**
   * Get the GitHub Releases API URL for the current Foundry VTT module.
   * This function tries to extract the user and repo information from the module's URL and
   * construct the corresponding GitHub Releases API URL. If that fails, it falls back to a
   * default URL.
   */
  _getGitHubReleasesApi() {
    try {
      const parsedUrl = new URL(Fal.getModule().url)
      const [, user, repo] = parsedUrl.pathname.split('/')
      return 'https://api.github.com/repos/' + user + '/' + repo + '/releases'
    } catch {
      return 'https://api.github.com/repos/BlackStripedOne/fvtt-scene-weather/releases'
    }
  }

  /**
   * Retrieves the release versions from the GitHub API.
   * @async
   * @returns {Promise<Array<ReleaseVersion>>} A promise that resolves to an array of objects
   *  representing the release versions, or undefined if no releases were found.
   * @typedef {Object} ReleaseVersion
   * @property {string} version - The version number of the release.
   * @property {string} html - The release notes in HTML format.
   * @property {string} md - The release notes in Markdown format.
   * @property {string} url - The URL to view the release on GitHub.
   * @throws {Error} If an error occurs while fetching data from the GitHub API.
   */
  async _getReleaseVersions() {
    const releasesApi = this._getGitHubReleasesApi()
    const response = await fetch(releasesApi)
    if (response && response.ok) {
      const data = await response.json()
      const versions = data
        .map((release) => {
          if (!release.draft && !release.prerelease) {
            return {
              version: release.tag_name,
              html: this._markdownToHtml(release.body),
              md: release.body,
              url: release.html_url
            }
          }
        })
        .filter((item) => item !== undefined)
      return versions.length === 0 ? undefined : versions
    } else {
      return
    }
  }

  /**
   * Converts markdown to HTML.
   *
   * @param {string} markdown The markdown source to convert.
   * @returns {string} The converted HTML.
   */
  _markdownToHtml(markdown) {
    let html = ''

    // Escape special characters in inline elements.
    function escape(t) {
      return new Option(t).innerHTML
    }

    // Convert inline elements to HTML.
    function convertInlineElements(s) {
      return escape(s)
        .replace(/!\[([^\]]*)]\(([^(]+)\)/g, '<img alt="$1" src="$2">')
        .replace(/\[([^\]]+)]\(([^(]+?)\)/g, '<a href="$2" target="_blank" rel="nofollow">$1</a>')
        .replace(/(https?:\/\/[^\s]+)/g, (url) => {
          return '<a href="' + url + '">' + url.split('/').pop().replace(/\.[^/.]+$/, "") + '</a>';
        })
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g, '<strong>$2</strong>')
        .replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>')
    }

    // Convert markdown blocks to HTML.
    markdown
      // Trim leading and trailing whitespace.
      .replace(/^\s+|\r|\s+$/g, '')
      // Replace tabs with four spaces.
      .replace(/\t/g, '    ')
      // Split into blocks.
      .split(/\n\n+/)
      .forEach(function (block) {
        let tag = block[0]  // first remaining character determins the type of markdown tag
      let content = block
      // Determine the type of block.
      switch (tag) {
        case '-':
        // Unordered list.
            content = '<ul><li>' + content.split(/\n\- /).slice(1).map(convertInlineElements).join('</li>\n<li>') + '</li></ul>'
            break;
        case '1':
          // Ordered list.
            content = '<ol><li>' + content.split(/\n[1-9]\d*\.? /).slice(1).map(convertInlineElements).join('</li>\n<li>') + '</li></ol>'
            break;
        case ' ':
          // Code block.
            content = '<pre><code>' + escape(content.replace(/\n    /g, '\n').trim()) + '</code></pre>'
        break
        case '>':
          // Blockquote.
            content = '<blockquote>' + content.split(/\n> /).slice(1).map(convertInlineElements).join('\n') + '</blockquote>'
        break
        case '#':
          // Heading.
          let level = 1
          while (block[level] === '#') {
          level++
        }
            content = '<h' + level + '>' + convertInlineElements(block.slice(level).trim()) + '</h' + level + '>'
          break
        default:
        // Paragraph.
          content = '<p>' + convertInlineElements(content) + '</p>'
      }

      html += content
      })

    return html
  }

  /**
   * Updates the setting according to the user selection wether to set- or reset the welcomePrompt
   * @param {Event} event - The event triggering the update.
   * @param {FormData} formData - The data to expand and use for the update.
   */
  _updateObject(event, formData) {
    const data = expandObject(formData)
    if (data.reset) {
      Fal.setSetting('welcomePrompt', '0.0.0')
    } else if (data.dontShowAgain) {
      const currentModuleVersion = Fal.getModuleVersion()
      if (currentModuleVersion != 'development') {
        Fal.setSetting('welcomePrompt', Fal.getModuleVersion())
      }
    }
  }
}

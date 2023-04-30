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

import { Utils, Logger } from '../utils.js'

export class DashLine {
  // cache of PIXI.Textures for dashed lines
  static dashTextureCache = {}

  /**
   * Create a dashed Line
   *
   * @param graphics
   * @param [options]
   * @param [options.useTexture=false] - use the texture based render (useful for very large or very small dashed lines)
   * @param [options.dashes=[10,5] - an array holding the dash and gap (eg, [10, 5, 20, 5, ...])
   * @param [options.width=1] - width of the dashed line
   * @param [options.alpha=1] - alpha of the dashed line
   * @param [options.color=0xffffff] - color of the dashed line
   * @param [options.cap] - add a PIXI.LINE_CAP style to dashed lines (only works for useTexture: false)
   * @param [options.join] - add a PIXI.LINE_JOIN style to the dashed lines (only works for useTexture: false)
   * @param [options.alignment] - The alignment of any lines drawn (0.5 = middle, 1 = outer, 0 = inner)
   */
  constructor(graphics, options) {
    this.cursor = new PIXI.Point()
    this.scale = 1
    this.graphics = graphics
    options = Utils.mergeObject(
      {
        dash: [10, 5],
        width: 1,
        color: 0xffffff,
        alpha: 1,
        scale: 1,
        useTexture: false,
        alignment: 0.5
      },
      options
    )
    this.dash = options.dash
    this.dashSize = this.dash.reduce(function (a, b) {
      return a + b
    })
    this.useTexture = options.useTexture
    this.options = options
    this._setLineStyle()
  }

  /**
   * Calculates the Euclidean distance between two points in a 2D space.
   * @param {number} x1 - The x-coordinate of the first point.
   * @param {number} y1 - The y-coordinate of the first point.
   * @param {number} x2 - The x-coordinate of the second point.
   * @param {number} y2 - The y-coordinate of the second point.
   * @returns {number} The distance between the two points.
   */
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  /**
   * Returns a PIXI texture object that represents a dashed line with the given options and dash size.
   * If a texture with the same options exists in the cache, it returns the cached texture.
   * @static
   * @param {object} options - An object containing the options for the dashed line.
   * @param {number[]} options.dash - An array of numbers representing the length of the dashes and the gaps between them.
   * @param {number} options.width - The width of the line.
   * @param {number} options.alpha - The alpha value of the line.
   * @param {number} dashSize - The size of the dash to use for the texture.
   * @returns {PIXI.Texture} - A PIXI texture object representing the dashed line.
   */
  static getTexture(options, dashSize) {
    // get the key for the options object
    var key = options.dash.toString()
    // check if a texture with the same options exists in the cache
    if (DashLine.dashTextureCache[key]) {
      // if so, return the cached texture
      return DashLine.dashTextureCache[key]
    }
    var canvas = document.createElement('canvas')
    // set the canvas width and height based on the dash size and line width
    canvas.width = dashSize
    canvas.height = Math.ceil(options.width)
    var context = canvas.getContext('2d')
    // if the context is null, log a warning and return undefined
    if (!context) {
      Logger.warn('Did not get context from canvas')
      return
    }
    context.strokeStyle = 'white'
    context.globalAlpha = options.alpha
    context.lineWidth = options.width
    var x = 0
    var y = options.width / 2
    context.moveTo(x, y)
    for (var i = 0; i < options.dash.length; i += 2) {
      x += options.dash[i]
      context.lineTo(x, y)
      if (options.dash.length !== i + 1) {
        x += options.dash[i + 1]
        context.moveTo(x, y)
      }
    }
    // stroke the path to create the line
    context.stroke()
    // create a new PIXI texture from the canvas
    var texture = (DashLine.dashTextureCache[key] = PIXI.Texture.from(canvas))
    // set the texture scaling mode to nearest
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
    // return the texture
    return texture
  }

  /**
   * resets line style to enable dashed line (useful if lineStyle was changed on graphics element)
   */
  _setLineStyle() {
    const options = this.options
    if (this.useTexture) {
      const texture = DashLine.getTexture(options, this.dashSize)
      this.graphics.lineTextureStyle({
        width: options.width * options.scale,
        color: options.color,
        alpha: options.alpha,
        texture: texture,
        alignment: options.alignment
      })
      this.activeTexture = texture
    } else {
      this.graphics.lineStyle({
        width: options.width * options.scale,
        color: options.color,
        alpha: options.alpha,
        cap: options.cap,
        join: options.join,
        alignment: options.alignment
      })
    }
    this.scale = options.scale
  }

  // adjust the matrix for the dashed texture
  _adjustLineStyle(angle) {
    var lineStyle = this.graphics.line
    lineStyle.matrix = new PIXI.Matrix()
    if (angle) {
      lineStyle.matrix.rotate(angle)
    }
    if (this.scale !== 1) lineStyle.matrix.scale(this.scale, this.scale)
    var textureStart = -this.lineLength
    lineStyle.matrix.translate(
      this.cursor.x + textureStart * Math.cos(angle),
      this.cursor.y + textureStart * Math.sin(angle)
    )
    this.graphics.lineStyle(lineStyle)
  }

  /**
   * Moves the current drawing position to x, y.
   * @param x - the X coordinate to move to
   * @param y - the Y coordinate to move to
   * @returns - This Graphics object. Good for chaining method calls
   */
  moveTo(x, y) {
    this.lineLength = 0
    this.cursor.set(x, y)
    this.start = new PIXI.Point(x, y)
    this.graphics.moveTo(this.cursor.x, this.cursor.y)
    return this
  }

  /**
   * Draws a dashed line using the current line style from the current drawing position to (x, y)
   * The current drawing position is then set to (x, y).
   *
   * @param x - the X coordinate to draw to
   * @param y - the Y coordinate to draw to
   * @returns - This Graphics object. Good for chaining method calls
   */
  lineTo(x, y, closePath) {
    if (typeof this.lineLength === undefined) {
      this.moveTo(0, 0)
    }
    const length = DashLine.distance(this.cursor.x, this.cursor.y, x, y)
    const angle = Math.atan2(y - this.cursor.y, x - this.cursor.x)
    const closed = closePath && x === this.start.x && y === this.start.y
    if (this.useTexture) {
      this.graphics.moveTo(this.cursor.x, this.cursor.y)
      this._adjustLineStyle(angle)
      if (closed && this.dash.length % 2 === 0) {
        const gap = Math.min(this.dash[this.dash.length - 1], length)
        this.graphics.lineTo(x - Math.cos(angle) * gap, y - Math.sin(angle) * gap)
        this.graphics.closePath()
      } else {
        this.graphics.lineTo(x, y)
      }
    } else {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      var x0 = this.cursor.x
      var y0 = this.cursor.y
      // find the first part of the dash for this line
      const place = this.lineLength % (this.dashSize * this.scale)
      var dashIndex = 0,
        dashStart = 0
      var dashX = 0
      for (var i = 0; i < this.dash.length; i++) {
        const dashSize = this.dash[i] * this.scale
        if (place < dashX + dashSize) {
          dashIndex = i
          dashStart = place - dashX
          break
        } else {
          dashX += dashSize
        }
      }
      var remaining = length
      while (remaining > 0) {
        const dashSize = this.dash[dashIndex] * this.scale - dashStart
        var dist = remaining > dashSize ? dashSize : remaining
        if (closed) {
          var remainingDistance = DashLine.distance(
            x0 + cos * dist,
            y0 + sin * dist,
            this.start.x,
            this.start.y
          )
          if (remainingDistance <= dist) {
            if (dashIndex % 2 === 0) {
              var lastDash =
                DashLine.distance(x0, y0, this.start.x, this.start.y) -
                this.dash[this.dash.length - 1] * this.scale
              x0 += cos * lastDash
              y0 += sin * lastDash
              this.graphics.lineTo(x0, y0)
            }
            break
          }
        }
        x0 += cos * dist
        y0 += sin * dist
        if (dashIndex % 2) {
          this.graphics.moveTo(x0, y0)
        } else {
          this.graphics.lineTo(x0, y0)
        }
        remaining -= dist
        dashIndex++
        dashIndex = dashIndex === this.dash.length ? 0 : dashIndex
        dashStart = 0
      }
    }
    this.lineLength += length
    this.cursor.set(x, y)
    return this
  }

  /**
   * Closes the current path.
   * @returns - Returns itself.
   */
  closePath() {
    this.lineTo(this.start.x, this.start.y, true)
  }

  /**
   * Draws a circle.
   * @param x - The X coordinate of the center of the circle
   * @param y - The Y coordinate of the center of the circle
   * @param radius - The radius of the circle
   * @returns - This Graphics object. Good for chaining method calls
   */
  drawCircle(x, y, radius, points = 80, matrix) {
    const interval = (Math.PI * 2) / points
    var angle = 0,
      first
    if (matrix) {
      first = new PIXI.Point(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
      matrix.apply(first, first)
      this.moveTo(first[0], first[1])
    } else {
      first = new PIXI.Point(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
      this.moveTo(first.x, first.y)
    }
    angle += interval
    for (var i = 1; i < points + 1; i++) {
      const next =
        i === points ? first : [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
      this.lineTo(next[0], next[1])
      angle += interval
    }
    return this
  }

  /**
   * Draws an ellipse.
   * @param x - The X coordinate of the center of the ellipse
   * @param y - The Y coordinate of the center of the ellipse
   * @param width - The half width of the ellipse
   * @param height - The half height of the ellipse
   * @param points
   * @param matrix
   * @returns - This Graphics object. Good for chaining method calls
   */
  drawEllipse(x, y, radiusX, radiusY, points = 80, matrix) {
    const interval = (Math.PI * 2) / points
    var first
    var point = new PIXI.Point()
    for (var i = 0; i < Math.PI * 2; i += interval) {
      var x0 = x - radiusX * Math.sin(i)
      var y0 = y - radiusY * Math.cos(i)
      if (matrix) {
        point.set(x0, y0)
        matrix.apply(point, point)
        x0 = point.x
        y0 = point.y
      }
      if (i === 0) {
        this.moveTo(x0, y0)
        first = { x: x0, y: y0 }
      } else {
        this.lineTo(x0, y0)
      }
    }
    this.lineTo(first.x, first.y, true)
    return this
  }

  /**
   * Draws a polygon using the given path.
   * @param {number[]|PIXI.IPointData[]|PIXI.Polygon} path - The path data used to construct the polygon.
   * @returns - This Graphics object. Good for chaining method calls
   */
  drawPolygon(points, matrix) {
    var p = new PIXI.Point()
    if (typeof points[0] === 'number') {
      if (matrix) {
        p.set(points[0], points[1])
        matrix.apply(p, p)
        this.moveTo(p.x, p.y)
        for (var i = 2; i < points.length; i += 2) {
          p.set(points[i], points[i + 1])
          matrix.apply(p, p)
          this.lineTo(p.x, p.y, i === points.length - 2)
        }
      } else {
        this.moveTo(points[0], points[1])
        for (var i = 2; i < points.length; i += 2) {
          this.lineTo(points[i], points[i + 1], i === points.length - 2)
        }
      }
    } else {
      if (matrix) {
        var point = points[0]
        p.copyFrom(point)
        matrix.apply(p, p)
        this.moveTo(p.x, p.y)
        for (var i = 1; i < points.length; i++) {
          var point_1 = points[i]
          p.copyFrom(point_1)
          matrix.apply(p, p)
          this.lineTo(p.x, p.y, i === points.length - 1)
        }
      } else {
        var point = points[0]
        this.moveTo(point.x, point.y)
        for (var i = 1; i < points.length; i++) {
          var point_2 = points[i]
          this.lineTo(point_2.x, point_2.y, i === points.length - 1)
        }
      }
    }
    return this
  }

  /**
   * Draws a rectangle shape.
   * @param x - The X coord of the top-left of the rectangle
   * @param y - The Y coord of the top-left of the rectangle
   * @param width - The width of the rectangle
   * @param height - The height of the rectangle
   * @returns - This Graphics object. Good for chaining method calls
   */
  drawRect(x, y, width, height, matrix) {
    if (matrix) {
      var p = new PIXI.Point()
      p.set(x, y)
      matrix.apply(p, p)
      this.moveTo(p.x, p.y)
      p.set(x + width, y)
      matrix.apply(p, p)
      this.lineTo(p.x, p.y)
      p.set(x + width, y + height)
      matrix.apply(p, p)
      this.lineTo(p.x, p.y)
      p.set(x, y + height)
      matrix.apply(p, p)
      this.lineTo(p.x, p.y)
      p.set(x, y)
      matrix.apply(p, p)
      this.lineTo(p.x, p.y, true)
    } else {
      this.moveTo(x, y)
        .lineTo(x + width, y)
        .lineTo(x + width, y + height)
        .lineTo(x, y + height)
        .lineTo(x, y, true)
    }
    return this
  }
}

import { terser } from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'
import multi from '@rollup/plugin-multi-entry'

export default [
  {
    input: {
      include: [
        'scripts/*.js',
        'scripts/*/*.js',
        'scripts/*/*/*.js',
        'styles/main.scss'
      ],
      exclude: ['scripts/scene-weather.min.js']
    },
    output: {
      format: 'esm',
      file: 'scene-weather.min.js'
    },
    plugins: [
      terser({ keep_classnames: true, keep_fnames: true }),
      multi(),
      scss({ fileName: 'scene-weather.min.css', outputStyle: "compressed" })
    ]
  }
]

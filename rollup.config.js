import { terser } from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'
import multi from '@rollup/plugin-multi-entry'

export default [
  {
    input: {
      include: [
        'scripts/*.js',
        'scripts/*/*.js',
        'scripts/*/*/*.js'
      ],
      exclude: ['scripts/scene-weather.min.js']
    },
    output: {
      format: 'esm',
      file: 'scripts/scene-weather.min.js'
    },
    plugins: [
      terser({ keep_classnames: true, keep_fnames: true }),
      multi(),
      scss({
        include: ["styles/*.css"],
        output: 'styles/scene-weather.min.css',
        outputStyle: "compressed"
      })
    ]
  }
]
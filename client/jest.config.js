const { defaults: tsjPreset } = require('ts-jest/presets')
const {escapeRegExp} = require('ramda-adjunct')

const esmModules = [
  /(jest-)?react-native/,
  /@react-native(-community)?/,
  /expo-[^\/]*/,
  '@budget-planner',
  /react-native-(redash|reanimated)/,
  /d3(-(array|axis|brush|chord|color|contour|delaunay|dispatch|drag|dsv|ease|fetch|force|format|geo|hierarchy|interpolate|path|polygon|quadtree|random|scale-chromatic|scale|selection|shape|time-format|time|timer|transition|zoom))?/,
  'internmap',
  'delaunator',
  'robust-predicates',
]
const esmModulesStr = esmModules.map(mod => typeof mod === 'string' ? escapeRegExp(mod) : mod.source).join('|')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...tsjPreset,
  displayName: 'Client',
  preset: 'react-native',
  transformIgnorePatterns: [
    `node_modules/(?!(${esmModulesStr})/)`,
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleNameMapper: {
    "^@budget-planner/([^/]*)(.*)": "<rootDir>/../$1/src$2"
  },
  setupFilesAfterEnv: ['jest-extended/all', "@testing-library/jest-native/extend-expect", 'react-native-gesture-handler/jestSetup.js', '<rootDir>/jest.setup.js']
};

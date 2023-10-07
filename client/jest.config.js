const { defaults: tsjPreset } = require('ts-jest/presets')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...tsjPreset,
  displayName: 'Client',
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)/|expo-modules-core/|expo-file-system/|@budget-planner/)',
  ],
  transform: {
    '^.+\\.jsx$': 'babel-jest',
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

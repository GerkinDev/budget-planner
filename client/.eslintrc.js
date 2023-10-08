module.exports = {
  root: true,
  extends: ['@react-native', '@knodes/eslint-config/fragments/plugins/import'],
  rules: {
    'react/no-unstable-nested-components': ['warn', {allowAsProps: true}],
  },
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
};

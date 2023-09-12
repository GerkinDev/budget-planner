const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path')
const _ = require('lodash')

const wsRoot = path.resolve(__dirname, "..");

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    watchFolders: [wsRoot],
    resolver: {
        unstable_enableSymlinks: true,
        unstable_enablePackageExports: true,
        extraNodeModules: {
            '~': path.resolve(__dirname, 'src')
        }
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

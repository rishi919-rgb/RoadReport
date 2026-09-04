/**
 * @file babel.config.js
 * @description Babel configuration for Expo.
 * Configures the project presets and plugs in NativeWind to compile Tailwind CSS utility classes.
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};

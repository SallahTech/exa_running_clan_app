// Expo's default Metro config. Present so the transformer resolves
// babel-preset-expo from this project rather than guessing.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);

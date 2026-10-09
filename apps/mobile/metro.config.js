// Expo's default config already watches npm workspaces; the engine (@fu/engine) is consumed from TypeScript source.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
module.exports = config;

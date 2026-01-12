/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add the src and packages directories to watch folders
config.watchFolders = [
  path.resolve(__dirname, "../legacy"),
  path.resolve(__dirname, "../packages/native"),
  path.resolve(__dirname, "../packages/core"),
  path.resolve(__dirname, "../packages/shared"),
  path.resolve(__dirname, "../packages/markdown"),
];

// Configure module resolution using the same approach as the working example
config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy(
    {},
    {
      get: (target, name) => {
        if (Object.prototype.hasOwnProperty.call(target, name))
          return target[name];

        if (name === "react-native-ajora") {
          return path.resolve(__dirname, "../legacy");
        } else if (name === "@ajora-ai/shared") {
          return path.resolve(__dirname, "../packages/shared");
        } else if (name === "@ajora-ai/core") {
          return path.resolve(__dirname, "../packages/core");
        } else if (name === "@ajora-ai/native") {
          return path.resolve(__dirname, "../packages/native");
        } else if (name === "@ajora-ai/markdown") {
          return path.resolve(__dirname, "../packages/markdown");
        }

        return path.join(__dirname, `node_modules/${name}`);
      },
    }
  ),
};

module.exports = config;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add the src directory to watch folders
config.watchFolders = [path.resolve(__dirname, "../src")];

// Configure module resolution using the same approach as the working example
config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy(
    {},
    {
      get: (target, name) => {
        if (Object.prototype.hasOwnProperty.call(target, name))
          return target[name];

        if (name === "react-native-ajora")
          return path.join(process.cwd(), "../src");

        return path.join(process.cwd(), `node_modules/${name}`);
      },
    }
  ),
};

module.exports = config;

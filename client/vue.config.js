// vue.config.js

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  devServer: {
    proxy: {
      "^/api": {
        target: "http://localhost:3000",
        // ws: true, // TODO: Use web sockets
        // changeOrigin: true, // TODO: Is this necessary?
        pathRewrite: { "^/api": "" },
        // logLevel: "debug",
      },
    },
  },
  configureWebpack: {
    devtool: "source-map",
  },
};

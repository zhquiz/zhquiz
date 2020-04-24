module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.ya?ml$/,
          type: 'json', // Required by Webpack v4
          use: 'yaml-loader'
        }
      ]
    }
  },
  devServer: {
    proxy: 'http://localhost:8080',
    port: 8081
  }
}

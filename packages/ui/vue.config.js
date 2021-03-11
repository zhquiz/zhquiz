process.env.SERVER_PORT = process.env.SERVER_PORT || '5000'

module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      template: 'public/index.html'
    },
    etabs: {
      entry: 'src/etabs.ts',
      template: 'public/etabs.html'
    }
  },
  devServer: {
    proxy: `http://localhost:${process.env.SERVER_PORT}`,
    port: 35594
  }
}

process.env.SERVER_PORT = process.env.SERVER_PORT || '5000'

module.exports = {
  devServer: {
    proxy: `http://localhost:${process.env.SERVER_PORT}`
  }
}

module.exports = {
  publicPath: '/zhview',
  pluginOptions: {
    prerenderSpa: {
      registry: undefined,
      renderRoutes: [
        '/',
        '/hanzi',
        '/vocab',
        '/sentence'
      ],
      useRenderEvent: true,
      headless: true,
      onlyProduction: true
    }
  }
}

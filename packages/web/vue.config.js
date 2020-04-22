module.exports = {
  pluginOptions: {
    prerenderSpa: {
      registry: undefined,
      renderRoutes: [
        '/',
        '/hanzi',
        '/vocab'
      ],
      useRenderEvent: true,
      headless: true,
      onlyProduction: true
    }
  }
}

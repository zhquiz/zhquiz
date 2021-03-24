import fastify, { FastifyPluginAsync } from 'fastify'
import fastifySwagger from 'fastify-swagger'

import { isDev } from '../shared'

const apiRouter: FastifyPluginAsync = async (f) => {
  f.register(fastifySwagger, {
    openapi: {},
    exposeRoute: isDev,
    routePrefix: '/doc'
  })
}

export default apiRouter

async function main() {
  const app = fastify({
    logger: {
      prettyPrint: true
    }
  })

  app.register(apiRouter, {
    prefix: '/api'
  })

  return app.listen(process.env.SERVER_PORT!)
}

if (require.main === module) {
  main()
}

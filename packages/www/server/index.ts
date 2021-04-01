import path from 'path'
import qs from 'querystring'

import fastify from 'fastify'
import fastifyStatic from 'fastify-static'

import apiRouter from './api'
import { gCloudLogger } from './logger'
import { isDev } from './shared'

async function main() {
  const port = parseInt(process.env.PORT!) || 35594
  process.env.PORT = port.toString()

  const app = fastify({
    logger: gCloudLogger({
      prettyPrint: isDev,
      serializers: {
        req(req) {
          if (!req.url) {
            return { method: req.method }
          }

          const [url, q] = req.url.split(/\?(.+)$/)
          const query = q ? qs.parse(q) : undefined

          return { method: req.method, url, query }
        },
      },
    }),
  })

  app.register(apiRouter, {
    prefix: '/api',
  })

  app.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    redirect: true,
  })

  app.setNotFoundHandler((_, reply) => {
    reply.redirect(200, '/')
  })

  await app.listen(port, '0.0.0.0')
}

if (require.main === module) {
  main()
}

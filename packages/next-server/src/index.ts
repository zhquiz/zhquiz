import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import { MikroORM } from '@mikro-orm/core'
import fastify from 'fastify'
import helmet from 'fastify-helmet'
import fastifyStatic from 'fastify-static'

import { logger } from './logger'

async function main() {
  const orm = await MikroORM.init()

  if (!fs.existsSync('session-key')) {
    execSync('./node_modules/.bin/secure-session-gen-key > session-key', {
      stdio: 'inherit'
    })
  }

  const app = fastify({ logger })
  const port = parseInt(process.env.PORT || '36393')

  app.register(helmet)

  app.register(fastifyStatic, {
    root: path.resolve('public')
  })

  // app.register(apiRouter, { prefix: '/api' })

  app.setNotFoundHandler((_, reply) => {
    reply.sendFile('index.html')
  })

  app.listen(
    port,
    !process.env.GOOGLE_CLOUD_PROJECT || process.env.NODE_ENV === 'production'
      ? 'localhost'
      : '0.0.0.0',
    (err) => {
      if (err) {
        throw err
      }

      console.info(`Go to http://localhost:${port}`)
    }
  )
}

if (require.main === module) {
  main().catch(console.error)
}

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import fastify from 'fastify'
import helmet from 'fastify-helmet'
import fastifyStatic from 'fastify-static'
import mongoose from 'mongoose'

import apiRouter from './api'
import { logger } from './logger'

async function main() {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })

  if (!fs.existsSync('session-key')) {
    execSync('./node_modules/.bin/secure-session-gen-key > session-key', {
      stdio: 'inherit'
    })
  }

  const app = fastify({ logger })
  const port = parseInt(process.env.PORT || '8080')

  app.register(helmet)

  app.register(fastifyStatic, {
    root: path.resolve('public')
  })

  app.register(apiRouter, { prefix: '/api' })

  app.get('/', (_, reply) => {
    reply.sendFile('index.html')
  })

  app.setNotFoundHandler((_, reply) => {
    reply.status(200).sendFile('index.html')
  })

  app.listen(
    port,
    process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
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

import path from 'path'

import fastify from 'fastify'
import helmet from 'fastify-helmet'
import fStatic from 'fastify-static'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import apiRouter from './api'

async function main () {
  dotenv.config()

  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })

  const app = fastify({
    logger: {
      prettyPrint: true
    }
  })
  const port = parseInt(process.env.PORT || '8080')

  app.register(helmet)
  app.register(apiRouter, { prefix: '/api' })

  app.register(fStatic, {
    root: path.resolve('public')
  })

  app.get('*', (_, reply) => {
    reply.sendFile('index.html')
  })

  app.addHook('preHandler', async (req, reply) => {
    const isHttps = ((req.headers['x-forwarded-proto'] || '').substring(0, 5) === 'https')
    if (isHttps) {
      return
    }

    const host = req.headers.host || req.hostname

    if (['localhost', '127.0.0.1'].includes(host.split(':')[0])) {
      return
    }

    const { method, url } = req.req

    if (method && ['GET', 'HEAD'].includes(method)) {
      reply.redirect(301, `https://${host}${url}`)
    }
  })

  app.listen(
    port,
    process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
    (err) => {
      if (err) {
        throw err
      }

      console.log(`Go to http://localhost:${port}`)
    }
  )
}

main()

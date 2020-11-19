import fs from 'fs'
import os from 'os'
import path from 'path'

import { FastifyInstance } from 'fastify'
import fSession from 'fastify-secure-session'
import swagger from 'fastify-swagger'
import admin from 'firebase-admin'
import { Ulid } from 'id128'

// import { UserModel } from '../db/mongo'
import { ser } from '../shared'
// import noteRouter from './note'
// import presetRouter from './preset'
// import quizRouter from './quiz'
// import userRouter from './user'
import { filterObjValue } from './util'

const apiRouter = (f: FastifyInstance, _: unknown, next: () => void) => {
  let isFirebase = false

  if (process.env.FIREBASE_SDK && process.env.FIREBASE_CONFIG) {
    const config = JSON.parse(process.env.FIREBASE_CONFIG)
    admin.initializeApp({
      ...config,
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SDK))
    })

    isFirebase = true
  }

  if (process.env.NODE_ENV === 'development') {
    f.register(require('fastify-cors'))
  }

  f.register(fSession, { key: fs.readFileSync('session-key') })

  f.addHook('preHandler', function (req, _, done) {
    if (req.body && typeof req.body === 'object') {
      req.log.info(
        {
          body: filterObjValue(
            req.body,
            /**
             * This will keep only primitives, nulls, plain objects, Date, and RegExp
             * ArrayBuffer in file uploads will be removed.
             */
            (v) => ser.hash(v) === ser.hash(ser.clone(v))
          )
        },
        'parsed body'
      )
    }
    done()
  })

  f.addHook<{
    Querystring: Record<string, string | string[]>
  }>('preValidation', async (req) => {
    if (typeof req.query.select === 'string') {
      req.query.select = req.query.select.split(/,/g)
    }
  })

  f.register(swagger, {
    swagger: {
      info: {
        title: 'Rep2recall API',
        description: 'Full JavaScript/CSS/HTML customizable quiz',
        version: '0.1.0'
      },
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        basicAuth: {
          type: 'basic'
        },
        apiKey: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    },
    exposeRoute: true,
    routePrefix: '/doc'
  })

  f.addHook('preHandler', async (req, reply) => {
    if (
      req.url &&
      (req.url.startsWith('/api/doc') ||
        req.url.startsWith('/api/firebase.config.js'))
    ) {
      return
    }

    let userId: string | undefined

    if (process.env.DEFAULT_USER) {
      const email = process.env.DEFAULT_USER

      userId = await UserModel.findOne({ email })
        .then(
          (u) =>
            u ||
            UserModel.create({
              email,
              name: email.replace(/@.+$/, ''),
              image: 'https://www.gravatar.com/avatar/0?d=mp'
            })
        )
        .then((u) => u._id)

      req.session.set('userId', userId)
      return
    }

    const { authorization } = req.headers

    if (!authorization) {
      reply.status(401).send({})
      return
    }

    const isBasic = async () => {
      const m = /^Basic (.+)$/.exec(authorization)

      if (!m) {
        return
      }

      const credentials = Buffer.from(m[1], 'base64').toString()
      const [email, apiKey] = credentials.split(':')
      if (!apiKey) {
        return false
      }

      return UserModel.findOne({
        email,
        apiKey
      }).then((u) => u?._id)
    }

    const isBearer = async () => {
      if (!isFirebase) {
        return
      }

      const m = /^Bearer (.+)$/.exec(authorization)

      if (!m) {
        return
      }

      const ticket = await admin.auth().verifyIdToken(m[1], true)
      const userId = req.session.get('userId')
      if (userId) {
        return userId
      }

      if (ticket.email) {
        const email = ticket.email
        return await UserModel.findOne({ email })
          .then(async (u) => {
            if (u) {
              return u
            }

            let image = 'https://www.gravatar.com/avatar/0?d=mp'
            if (ticket.picture) {
              const tmpDir = path.join(os.tmpdir(), 'rep2recall')
              try {
                fs.mkdirSync(tmpDir)
              } catch (_) {}

              const filePath = path.join(
                tmpDir,
                Ulid.generate().toCanonical() + '.png'
              )
              fs.writeFileSync(
                filePath,
                await fetch(ticket.picture).then((r) => r.buffer())
              )

              const [f] = await admin.storage().bucket().upload(filePath)
              await f.makePublic()
              image = f.metadata.mediaLink
            }

            return UserModel.create({
              email,
              name: ticket.name,
              image
            })
          })
          .then((u) => u._id as string)
      }
    }

    userId = (await isBasic()) || (await isBearer())

    if (userId) {
      req.session.set('userId', userId)
      return
    }

    reply.status(401).send({})
  })

  if (isFirebase) {
    f.get('/firebase.config.js', (_, reply) => {
      reply
        .type('text/javascript')
        .send(`FIREBASE_CONFIG = '${process.env.FIREBASE_CONFIG}'`)
    })
  }

  f.register(noteRouter, { prefix: '/note' })
  f.register(presetRouter, { prefix: '/preset' })
  f.register(quizRouter, { prefix: '/quiz' })
  f.register(userRouter, { prefix: '/user' })

  next()
}

export default apiRouter

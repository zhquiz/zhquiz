import fs from 'fs'

import { FastifyInstance } from 'fastify'
import fSession from 'fastify-secure-session'
import admin from 'firebase-admin'

import { UserModel } from '../db/mongo'
import { ser } from '../shared'
import chineseRouter from './chinese'
import extraRouter from './extra'
import hanziRouter from './hanzi'
import quizRouter from './quiz'
import sentenceRouter from './sentence'
import userRouter from './user'
import { filterObjValue } from './util'
import vocabRouter from './vocab'

export default (f: FastifyInstance, _: any, next: () => void) => {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SDK!)),
    databaseURL: JSON.parse(process.env.FIREBASE_CONFIG!).databaseURL
  })

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

  f.addHook('preHandler', async (req, reply) => {
    if (req.url === '/api/firebase.config.js') {
      return
    }

    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')

    if (!m) {
      return
    }

    const { email, name, picture } = await admin
      .auth()
      .verifyIdToken(m[1], true)

    if (email) {
      const u = await UserModel.findOne({ email })
      if (u) {
        req.session.set('userId', u._id)
        return
      }

      await UserModel.create({
        email,
        name: name || email.replace(/@.+$/, ''),
        image: picture || 'https://www.gravatar.com/avatar/0?d=mp'
      }).then((u) => {
        req.session.set('userId', u._id)
      })

      return
    }

    reply.status(401).send({
      error: 'Not authorized'
    })
  })

  if (process.env.FIREBASE_CONFIG) {
    f.get('/firebase.config.js', async () => {
      return /* js */ `
      var FIREBASE_CONFIG = ${process.env.FIREBASE_CONFIG}
      `
    })
  }

  f.register(chineseRouter, { prefix: '/chinese' })
  f.register(extraRouter, { prefix: '/extra' })
  f.register(hanziRouter, { prefix: '/hanzi' })
  f.register(quizRouter, { prefix: '/quiz' })
  f.register(sentenceRouter, { prefix: '/sentence' })
  f.register(userRouter, { prefix: '/user' })
  f.register(vocabRouter, { prefix: '/vocab' })

  next()
}

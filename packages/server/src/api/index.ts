import fs from 'fs'

import { FastifyInstance } from 'fastify'
import fSession from 'fastify-secure-session'
import admin from 'firebase-admin'

import { DbUserModel } from '../db/mongo'

import cardRouter from './card'
import chineseRouter from './chinese'
import extraRouter from './extra'
import hanziRouter from './hanzi'
import quizRouter from './quiz'
import sentenceRouter from './sentence'
import userRouter from './user'
import vocabRouter from './vocab'

export default (f: FastifyInstance, _: any, next: () => void) => {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SDK!)),
    databaseURL: JSON.parse(process.env.FIREBASE_CONFIG!).databaseURL,
  })

  if (process.env.NODE_ENV === 'development') {
    f.register(require('fastify-cors'))
  }

  f.register(fSession, { key: fs.readFileSync('session-key') })

  f.addHook('preHandler', async (req, reply) => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')

    if (!m) {
      reply.status(401).send(null)
      return
    }

    const ticket = await admin.auth().verifyIdToken(m[1], true)
    const user = req.session.get('user')

    if (!user && ticket.email) {
      req.session.set(
        'user',
        await DbUserModel.signIn(ticket.email, ticket.name)
      )
    }
  })

  f.register(chineseRouter, { prefix: '/chinese' })
  f.register(sentenceRouter, { prefix: '/sentence' })
  f.register(vocabRouter, { prefix: '/vocab' })
  f.register(hanziRouter, { prefix: '/hanzi' })
  f.register(cardRouter, { prefix: '/card' })
  f.register(userRouter, { prefix: '/user' })
  f.register(quizRouter, { prefix: '/quiz' })
  f.register(extraRouter, { prefix: '/extra' })

  next()
}

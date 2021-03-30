import { execSync } from 'child_process'
import fs from 'fs'
import qs from 'querystring'

import sql from '@databases/sql'
import fastify, { FastifyPluginAsync } from 'fastify'
import csrf from 'fastify-csrf'
import rateLimit from 'fastify-rate-limit'
import fSession from 'fastify-secure-session'
import fastifySwagger from 'fastify-swagger'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { db, isDev, magic } from '../shared'
import characterRouter from './character'
import extraRouter from './extra'
import libraryRouter from './library'
import presetRouter from './preset'
import quizRouter from './quiz'
import sentenceRouter from './sentence'
import userRouter from './user'
import utilRouter from './util'
import vocabularyRouter from './vocabulary'

const apiRouter: FastifyPluginAsync = async (f) => {
  if (!fs.existsSync('session.key')) {
    execSync('./node_modules/.bin/secure-session-gen-key > session.key')
  }

  f.register(fSession, {
    key: fs.readFileSync('session.key'),
  })

  f.register(rateLimit, {
    max: isDev ? 20 : 10,
    timeWindow: '1 second',
  })

  f.register(fastifySwagger, {
    openapi: {
      security: [
        {
          BearerAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    },
    exposeRoute: isDev,
    routePrefix: '/doc',
  })

  f.addHook('preHandler', async (req) => {
    const { body, log } = req

    if (body && typeof body === 'object' && body.constructor === Object) {
      log.info({ body }, 'parsed body')
    }
  })

  f.register(csrf, {
    sessionPlugin: 'fastify-secure-session',
  })

  // if (!isDev) {
  //   f.addHook('onRequest', (req, reply, next) => {
  //     if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
  //       next()
  //       return
  //     }

  //     f.csrfProtection(req, reply, next)
  //   })
  // }

  {
    const sResponse = S.shape({
      csrf: S.string(),
      magic: S.string().optional(),
    })

    f.get(
      '/settings',
      {
        schema: {
          operationId: 'settings',
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (_, reply): Promise<typeof sResponse.type> => {
        return {
          csrf: await reply.generateCsrf(),
          magic: process.env.MAGIC_PUBLIC,
        }
      }
    )
  }

  f.addHook('preHandler', async (req) => {
    if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
      return
    }

    if (req.session.get('userId')) {
      return
    }

    let user = process.env.DEFAULT_USER || ''

    if (!user) {
      if (!magic) {
        return
      }

      const [, apiKey] =
        /^Bearer (.+)$/.exec(req.headers.authorization || '') || []

      if (!apiKey) {
        throw { statusCode: 401 }
      }

      try {
        magic.token.validate(apiKey)
      } catch (e) {
        throw { statusCode: 401, message: e }
      }

      if (apiKey !== req.session.get('apiKey')) {
        const u = await magic.users.getMetadataByToken(apiKey)
        user = u.email || ''

        req.session.set('apiKey', apiKey)
      }
    }

    if (user) {
      let [r] = await db.query(sql`
        SELECT "id" FROM "user" WHERE "identifier" = ${user}
        `)

      if (!r) {
        const id = shortUUID.uuid()

        await db.query(sql`
          INSERT INTO "user" ("id", "identifier")
          VALUES (${id}, ${user})
          `)

        req.session.set('userId', id)
      } else {
        req.session.set('userId', r.id)
      }
    }
  })

  f.register(characterRouter, { prefix: '/character' })
  f.register(extraRouter, { prefix: '/extra' })
  f.register(libraryRouter, { prefix: '/library' })
  f.register(presetRouter, { prefix: '/preset' })
  f.register(quizRouter, { prefix: '/quiz' })
  f.register(sentenceRouter, { prefix: '/sentence' })
  f.register(userRouter, { prefix: '/user' })
  f.register(utilRouter, { prefix: '/util' })
  f.register(vocabularyRouter, { prefix: '/vocabulary' })
}

export default apiRouter

async function main() {
  const app = fastify({
    logger: {
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
    },
  })

  app.register(apiRouter, {
    prefix: '/api',
  })

  return app.listen(process.env.SERVER_PORT!, '0.0.0.0')
}

if (require.main === module) {
  main()
}

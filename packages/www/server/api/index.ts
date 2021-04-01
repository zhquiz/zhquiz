import qs from 'querystring'

import sql from '@databases/sql'
import ConnectPG from 'connect-pg-simple'
import fastify, { FastifyPluginAsync } from 'fastify'
import fCookie from 'fastify-cookie'
import csrf from 'fastify-csrf'
import rateLimit from 'fastify-rate-limit'
import fSession from 'fastify-session'
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
  f.register(fCookie)
  f.register(fSession, {
    secret: process.env.SECRET!,
    // @ts-ignore
    store: new (ConnectPG(fSession))(
      process.env.DATABASE_URL
        ? {
            conString: process.env.DATABASE_URL,
          }
        : {
            conObject: {
              user: process.env.POSTGRES_USER,
              password: process.env.POSTGRES_PASSWORD,
              database: process.env.POSTGRES_DB,
              host: process.env.POSTGRES_HOST,
            },
          }
    ),
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
    sessionPlugin: 'fastify-session',
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

    if (req.session.userId) {
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

      if (apiKey !== req.session.apiKey) {
        const u = await magic.users.getMetadataByToken(apiKey)
        user = u.email || ''

        req.session.apiKey = apiKey
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

        req.session.userId = id
      } else {
        req.session.userId = r.id
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

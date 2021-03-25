import { execSync } from 'child_process'
import fs from 'fs'

import sql from '@databases/sql'
import { Magic } from '@magic-sdk/admin'
import fastify, { FastifyPluginAsync } from 'fastify'
import csrf from 'fastify-csrf'
import fSession from 'fastify-secure-session'
import fastifySwagger from 'fastify-swagger'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'
import waitOn from 'wait-on'

import { db, isDev } from '../shared'
import characterRouter from './character'

const apiRouter: FastifyPluginAsync = async (f) => {
  const magic = process.env.MAGIC_SECRET
    ? new Magic(process.env.MAGIC_SECRET)
    : null

  if (!fs.existsSync('session.key')) {
    execSync('./node_modules/.bin/secure-session-gen-key > session.key')
  }

  f.register(fSession, {
    key: fs.readFileSync('session.key'),
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

  f.register(csrf, {
    sessionPlugin: 'fastify-secure-session',
  })

  if (!isDev) {
    f.addHook('onRequest', (req, reply, next) => {
      if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
        next()
        return
      }

      f.csrfProtection(req, reply, next)
    })
  }

  {
    const sResponse = S.shape({
      csrf: S.string(),
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
        }
      }
    )
  }

  f.addHook('onRequest', (req, reply, next) => {
    if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
      next()
      return
    }

    f.csrfProtection(req, reply, next)
  })

  if (magic) {
    f.addHook('preHandler', async (req) => {
      if (!magic) {
        return
      }

      if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
        return
      }

      const [apiKey] =
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

        let [r] = await db.query(sql`
        SELECT "id" FROM "user" WHERE "identifier" = ${u.email}
        `)

        if (!r) {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "user" ("id", "identifier")
          VALUES (${id}, ${u.email})
          `)

          req.session.set('userId', id)
        } else {
          req.session.set('userId', r.id)
        }

        req.session.set('apiKey', apiKey)
      }
    })
  }

  f.register(characterRouter, { prefix: '/character' })
}

export default apiRouter

async function main() {
  await waitOn({
    resources: ['tcp:5432'],
  })

  const app = fastify({
    logger: {
      prettyPrint: true,
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

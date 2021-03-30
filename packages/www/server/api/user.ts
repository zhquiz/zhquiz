import { SQLQuery, sql } from '@databases/pg'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { db } from '../shared'
import { sPreset } from './preset'

const userRouter: FastifyPluginAsync = async (f) => {
  {
    const sQueryQ = S.shape({
      select: S.string(),
    })

    const sResult = S.shape({
      identifier: S.string().optional(),
      level: S.integer().optional(),
      levelMin: S.integer().optional(),
      quizSettings: sPreset.optional(),
      levelBrowser: S.list(S.string()).optional(),
    })

    f.get<{
      Querystring: typeof sQueryQ.type
    }>(
      '/',
      {
        schema: {
          operationId: 'userGetSettings',
          querystring: sQueryQ.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { select } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const selMap: Record<keyof typeof sResult.type, SQLQuery> = {
          identifier: sql`"identifier"`,
          level: sql`"level.max" "level"`,
          levelMin: sql`"level.min" "levelMin"`,
          quizSettings: sql`"quiz.settings" "quizSettings"`,
          levelBrowser: sql`"level.vocabulary.showing" "levelBrowser"`,
        }

        const sel = select
          .split(',')
          .map((s) => (selMap as any)[s])
          .filter((s) => s)

        if (!sel.length) {
          throw { statusCode: 400, message: 'not enough select' }
        }

        const [r] = await db.query(
          sql`
        SELECT ${sql.join(sel, ',')} FROM "user" WHERE "id" = ${userId}
        `
        )
        if (!r) {
          throw { statusCode: 401 }
        }

        return {
          identifier: r.identifier || undefined,
          level: r.level || undefined,
          levelMin: r.levelMin || undefined,
          quizSettings: r.quizSettings || undefined,
          levelBrowser: r.levelBrowser || undefined,
        }
      }
    )
  }

  {
    const sBody = S.shape({
      level: S.integer().optional(),
      levelMin: S.integer().optional(),
      quizSettings: S.object().additionalProperties(true).optional(),
      levelBrowser: S.list(S.string()).optional(),
    })

    const sResult = S.shape({
      result: S.string(),
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'userUpdateSettings',
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!Object.keys(req.body).length) {
          throw { statusCode: 400, message: 'not enough update' }
        }

        const uMap: Record<keyof typeof sBody.type, SQLQuery> = {
          level: sql`"level.max" = ${req.body.level}`,
          levelMin: sql`"level.min" = ${req.body.levelMin}`,
          quizSettings: sql`"quiz.settings" = ${req.body.quizSettings}`,
          levelBrowser: sql`"level.vocabulary.showing" = ${req.body.levelBrowser}`,
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "user"
          SET ${sql.join(
            Object.keys(req.body).map((k) => (uMap as any)[k]),
            ','
          )}
          WHERE "id" = ${userId}
          `)
        })

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }

  f.get(
    '/signOut',
    {
      schema: {
        operationId: 'userSignOut',
      },
    },
    async (req, reply) => {
      const userId: string = req.session.get('userId')
      if (!userId) {
        throw { statusCode: 401 }
      }

      req.session.delete()
      reply.redirect('/')
    }
  )

  f.get(
    '/deleteUser',
    {
      schema: {
        operationId: 'userDelete',
      },
    },
    async (req, reply) => {
      const userId: string = req.session.get('userId')
      if (!userId) {
        throw { statusCode: 401 }
      }

      await db.tx(async (db) => {
        await db.query(sql`
        DELETE FROM "user"
        WHERE "id" = ${userId}
        `)
      })

      req.session.delete()
      reply.redirect('/')
    }
  )
}

export default userRouter

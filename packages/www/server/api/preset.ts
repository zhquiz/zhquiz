import { sql } from '@databases/pg'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { db } from '../shared'

export const sPreset = S.shape({
  q: S.string().optional(),
  type: S.list(S.string()),
  stage: S.list(S.string()),
  direction: S.list(S.string()),
  includeUndue: S.boolean(),
  includeLeech: S.boolean().optional(),
})

const presetRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = sPreset

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'presetGetOne',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const [r] = await db
          .query(
            sql`
        SELECT
          "settings"
        FROM "quiz_preset"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `
          )
          .then((rs) =>
            rs.map((r) => {
              return r.settings
            })
          )

        if (!r) {
          throw { statusCode: 404 }
        }

        return r
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
      page: S.integer().optional(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          name: S.string(),
        })
      ),
      count: S.integer(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'presetQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q, page = 1, limit = 10 } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const [r] = await db.query(
          sql`
        WITH match_cte AS (
          SELECT
            "id",
            "name"
          FROM "quiz_preset"
          WHERE "userId" = ${userId} ${
            q.trim() ? sql` AND "name" &@ ${q}` : sql``
          }
          ORDER BY "updatedAt" DESC, "createdAt" DESC
        )

        SELECT
          (
            SELECT json_agg(row_to_json)
            FROM (
              SELECT row_to_json(t)
              FROM (
                SELECT * FROM match_cte
                LIMIT ${limit} OFFSET ${(page - 1) * limit}
              ) t
            ) t1
          ) result,
          (
            SELECT COUNT(*) FROM match_cte
          ) "count"
        `
        )

        return { result: r.result, count: r.count }
      }
    )
  }

  {
    const sBody = S.shape({
      name: S.string(),
      settings: sPreset,
    })

    const sResult = S.shape({
      id: S.string(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'presetCreate',
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const { name, settings } = req.body

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "quiz_preset" ("id", "userId", "name", "settings")
          VALUES (${id}, ${userId}, ${name}, ${settings})
          `)

          return id
        })

        reply.status(201)
        return { id }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      name: S.string().optional(),
      settings: sPreset.optional(),
    })

    const sResult = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'presetUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id } = req.query
        const { name, settings } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "quiz_preset"
          SET ${sql.join(
            [
              ...(typeof name !== 'undefined' ? [sql`"name" = ${name}`] : []),
              ...(typeof settings !== 'undefined'
                ? [sql`"settings" = ${settings}`]
                : []),
            ],
            ','
          )}
          WHERE ${userId} = "userId" AND "id" = ${id}
          `)
        })

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      result: S.string(),
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'presetDelete',
          querystring: sQuery.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          DELETE FROM "quiz_preset"
          WHERE ${userId} = "userId" AND "id" = ${id}
          `)
        })

        reply.status(201)
        return {
          result: 'deleted',
        }
      }
    )
  }
}

export default presetRouter

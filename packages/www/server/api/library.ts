import { sql } from '@databases/pg'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { refresh } from '../db/refresh'
import { QSplit } from '../db/token'
import { db } from '../shared'

const libraryRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      entry: S.list(S.string()),
      title: S.string(),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
      isShared: S.boolean().optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryGetOne',
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
          "entry",
          "title",
          "type",
          "description",
          "tag",
          "isShared"
        FROM "library"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `
          )
          .then((rs) =>
            rs.map((r) => {
              return {
                entry: r.entry,
                title: r.title,
                type: r.type,
                description: r.description,
                tag: r.tag,
              }
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
          id: S.string().optional(),
          entry: S.list(S.string()),
          title: S.string(),
          type: S.string(),
          description: S.string(),
          tag: S.list(S.string()),
          isShared: S.boolean().optional(),
        })
      ),
      count: S.integer(),
    })

    const makeZh = new QSplit({
      default(v) {
        return sql`(${sql.join(
          [
            this.fields.entry[':'](v),
            this.fields.title[':'](v),
            this.fields.description[':'](v),
            this.fields.tag[':'](v),
          ],
          ' OR '
        )})`
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@ ${v}` },
        title: { ':': (v) => sql`"title" &@ ${v}` },
        type: {
          ':': (v) => {
            if (v === 'hanzi' || v === 'kanji') v = 'character'
            return sql`"type" = ${v}`
          },
        },
        description: { ':': (v) => sql`"description" &@ ${v}` },
        tag: { ':': (v) => sql`"tag " &@ ${v}` },
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'libraryQuery',
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
              "entry",
              "title",
              "type",
              "description",
              "tag",
              (CASE WHEN "userId" = ${userId} THEN "id" END) "id",
              "updatedAt",
              "isShared"
            FROM "library"
            WHERE (
              "isShared" OR "userId" = ${userId}
            ) AND ${makeZh.parse(q) || sql`TRUE`}
            ORDER BY "updatedAt" DESC, "createdAt" DESC, "title"
          )

          SELECT
          (
            SELECT json_agg(row_to_json)
            FROM (
              SELECT row_to_json(t)
              FROM (
                SELECT * FROM (
                  SELECT * FROM (
                    SELECT * FROM match_cte
                    WHERE "id" IS NOT NULL
                  ) t1
                  UNION ALL
                  SELECT * FROM (
                    SELECT * FROM match_cte
                    WHERE "id" IS NULL
                  ) t1
                ) t2
                LIMIT ${limit} OFFSET ${(page - 1) * limit}
              ) t
            ) t3
          ) result,
          (
            SELECT COUNT(*) FROM match_cte
          ) "count"
          `
        )

        return {
          result: r.result.map((r: any) => {
            return {
              id: r.id || undefined,
              entry: r.entry,
              title: r.title,
              type: r.type,
              description: r.description,
              tag: r.tag,
            }
          }),
          count: r.count,
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entry: S.list(S.string()),
      title: S.string(),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
      isShared: S.boolean().optional(),
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
          operationId: 'libraryCreate',
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { title, type, description, tag, entry, isShared } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "library" ("id", "userId", "title", "type", "description", "tag", "entry", "isShared")
          VALUES (${id}, ${userId} ${title}, ${type}, ${description}, ${tag}, ${entry}, ${isShared})
          `)

          return id
        })

        if (tag.length) {
          refresh('entry_tag')
        }

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
      entry: S.list(S.string()).optional(),
      title: S.string().optional(),
      type: S.string().optional(),
      description: S.string().optional(),
      tag: S.list(S.string()).optional(),
      isShared: S.boolean().optional(),
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
          operationId: 'libraryUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id } = req.query
        const { title, type, description, tag, entry, isShared } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "library"
          SET ${sql.join(
            [
              ...(typeof title !== 'undefined'
                ? [sql`"title" = ${title}`]
                : []),
              ...(typeof type !== 'undefined' ? [sql`"type" = ${type}`] : []),
              ...(typeof description !== 'undefined'
                ? [sql`"description" = ${description}`]
                : []),
              ...(typeof tag !== 'undefined' ? [sql`"tag" = ${tag}`] : []),
              ...(typeof entry !== 'undefined'
                ? [sql`"entry" = ${entry}`]
                : []),
              ...(typeof isShared !== 'undefined'
                ? [sql`"isShared" = ${isShared}`]
                : []),
            ],
            ','
          )}
          WHERE ${userId} = "userId" AND "id" = ${id}
          `)
        })

        if (tag) {
          refresh('entry_tag')
        }

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
          operationId: 'libraryDelete',
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

        const [x] = await db.query(sql`
        SELECT "tag" FROM "library"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `)

        if (!x) {
          throw { statusCode: 404 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          DELETE FROM "library"
          WHERE ${userId} = "userId" AND "id" = ${id}
          `)
        })

        if (x.tag.length) {
          refresh('entry_tag')
        }

        reply.status(201)
        return {
          result: 'deleted',
        }
      }
    )
  }
}

export default libraryRouter

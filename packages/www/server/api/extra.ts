import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { QSplit, makeQuiz, makeTag } from '../db/token'
import { db } from '../shared'
import { makeReading } from './util'

const extraRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      entry: S.list(S.string()).minItems(1),
      reading: S.list(S.string()),
      english: S.list(S.string()),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/id',
      {
        schema: {
          operationId: 'extraGetById',
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

        const [r] = await db.query(sql`
        SELECT "entry", "reading" "pinyin", "translation" "english", "description", "tag", "type"
        FROM "entry"
        WHERE "userId" = ${userId} AND "id" = ${id} AND "translation"[1] IS NOT NULL
        `)

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          entry: r.entry,
          reading: r.pinyin,
          english: r.english,
          type: r.type,
          description: r.description,
          tag: r.tag,
        }
      }
    )
  }

  {
    const sResponse = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      reading: S.list(S.string()),
      english: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'extraCreate',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry, reading, english, type, description, tag } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        if (
          type === 'character' &&
          !entry.every((it) => /^\p{sc=Han}$/u.test(it))
        ) {
          throw { statusCode: 400, message: 'not all Hanzi' }
        }

        if (!reading.length) {
          reading.push(makeReading(entry[0]))
        }

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "entry" ("entry", "reading", "translation", "description", "tag", "type", "userId", "id")
          VALUES (${entry}, ${reading}, ${english}, ${description}, ${tag}, ${type}, ${userId}, ${id})
          `)

          return id
        })

        reply.status(201)
        return {
          id,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      reading: S.list(S.string()),
      english: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      description: S.string(),
      tag: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'extraUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query
        const { entry, reading, english, type, description, tag } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        if (
          type === 'character' &&
          !entry.every((it) => /^\p{sc=Han}$/u.test(it))
        ) {
          throw { statusCode: 400, message: 'not all Hanzi' }
        }

        if (!reading.length) {
          reading.push(makeReading(entry[0]))
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "entry"
          SET
            "entry" = ${entry},
            "reading" = ${reading},
            "translation" = ${english},
            "description" = ${description},
            "tag" = ${tag},
            "type" = ${type}
          WHERE "userId" = ${userId} AND "id" = ${id}
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
      entry: S.string(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
    })

    const sResponse = S.shape({
      result: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/tags',
      {
        schema: {
          operationId: 'getTags',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry, type } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const rs = await db.query(sql`
        SELECT DISTINCT unnest "tag"
        FROM (
          SELECT unnest("tag")
          FROM "entry"
          WHERE (
            "userId" = uuid_nil() OR "userId" = ${userId}
          ) AND "type" = ${type} AND ${entry} = ANY("entry")
        ) t1
        `)

        return {
          result: rs.map((r) => r.tag),
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entry: S.string(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      tag: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/addTags',
      {
        schema: {
          operationId: 'addTags',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry, type, tag } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.query(sql`
        UPDATE "entry"
        SET "tag" = array_distinct("tag"||${tag})
        WHERE "userId" = ${userId} AND "type" = ${type} AND ${entry} = ANY("entry")
        `)

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entry: S.string(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      tag: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/removeTags',
      {
        schema: {
          operationId: 'removeTags',
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry, type, tag } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.query(sql`
        UPDATE "entry"
        SET "tag" = (
          SELECT array_agg(DISTINCT t)
          FROM (
            SELECT unnest("tag") t
          ) t1
          WHERE t != ANY(${tag})
        )
        WHERE "userId" = ${userId} AND "type" = ${type} AND ${entry} = ANY("entry")
        `)

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

    const sResponse = S.shape({
      result: S.string(),
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'extraDelete',
          querystring: sQuery.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.query(sql`
        DELETE FROM "entry"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `)

        reply.status(201)
        return {
          result: 'deleted',
        }
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
          id: S.string().format('uuid'),
          entry: S.list(S.string()).minItems(1),
          reading: S.list(S.string()),
          english: S.list(S.string()),
          type: S.string().enum('character', 'vocabulary', 'sentence'),
          tag: S.list(S.string()),
        })
      ),
      count: S.integer(),
    })

    const makeExtra = new QSplit({
      default(v) {
        if (/^\p{sc=Han}+$/u.test(v)) {
          return sql.join(
            [this.fields.entry[':'](v), this.fields.description[':'](v)],
            ' OR '
          )
        }

        return sql.join(
          [
            this.fields.entry[':'](v),
            this.fields.reading[':'](v),
            this.fields.english[':'](v),
            this.fields.type[':'](v),
            this.fields.description[':'](v),
          ],
          ' OR '
        )
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@ ${v}` },
        pinyin: { ':': (v) => sql`normalize_pinyin("reading") &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin("reading") &@ ${v}` },
        english: { ':': (v) => sql`"translation" &@ ${v}` },
        translation: { ':': (v) => sql`"translation" &@ ${v}` },
        type: { ':': (v) => sql`"type" = ${v}` },
        description: { ':': (v) => sql`"description" &@ ${v}` },
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'extraQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { page = 1, limit = 10 } = req.query
        let { q } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        q = q.trim()

        const tagCond = makeTag.parse(q)
        const quizCond = makeQuiz.parse(q)

        const [r] = await db.query(sql`
        WITH match_cte AS (
          SELECT
            "id",
            "entry"
            "reading",
            "translation" "english",
            "type",
            "tag"
          FROM "entry" e1
          WHERE "userId" = ${userId}
            AND ${makeExtra.parse(q) || sql`TRUE`}
            AND ${tagCond || sql`TRUE`}
            AND ${
              quizCond
                ? sql`"entry" IN (
              SELECT "entry" FROM "quiz" WHERE ${quizCond} AND "type" = e1."type"
            )`
                : sql`TRUE`
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
        `)

        return {
          result: r.result || [],
          count: r.count,
        }
      }
    )
  }
}

export default extraRouter

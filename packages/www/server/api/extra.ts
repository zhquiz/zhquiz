import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { refresh } from '../db/refresh'
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
          throw { statusCode: 401 }
        }

        const [r] = await db.query(sql`
        SELECT "entry", "pinyin", "english", "description", "tag", "type"
        FROM "extra"
        WHERE "userId" = ${userId} AND "id" = ${id} AND "english"[1] IS NOT NULL
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
          throw { statusCode: 401 }
        }

        if (
          type === 'character' &&
          !entry.every((it) => /^\p{sc=Han}$/u.test(it))
        ) {
          throw { statusCode: 400, message: 'not all Hanzi' }
        }

        if (!reading.length) {
          reading.push(await makeReading(entry[0]))
        }

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "extra" ("entry", "pinyin", "english", "description", "tag", "type", "userId", "id")
          VALUES (${entry}, ${reading}, ${english}, ${description}, ${tag}, ${type}, ${userId}, ${id})
          `)

          return id
        })

        if (tag.length) {
          refresh('entry_tag')
        }

        switch (type) {
          case 'character':
            refresh('"character"')
            break
          case 'sentence':
            refresh('sentence')
        }

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
          throw { statusCode: 401 }
        }

        if (
          type === 'character' &&
          !entry.every((it) => /^\p{sc=Han}$/u.test(it))
        ) {
          throw { statusCode: 400, message: 'not all Hanzi' }
        }

        if (!reading.length) {
          reading.push(await makeReading(entry[0]))
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "extra"
          SET
            "entry" = ${entry},
            "pinyin" = ${reading},
            "english" = ${english},
            "description" = ${description},
            "tag" = ${tag},
            "type" = ${type}
          WHERE "userId" = ${userId} AND "id" = ${id}
          `)
        })

        if (tag.length) {
          refresh('entry_tag')
        }

        switch (type) {
          case 'character':
            refresh('"character"')
            break
          case 'sentence':
            refresh('sentence')
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
          throw { statusCode: 401 }
        }

        const rs = await db.query(sql`
        SELECT "tag"
        FROM entry_tag
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND "type" = ${type} AND "entry" = ${entry}
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
          throw { statusCode: 401 }
        }

        const [r] = await db.query(sql`
        SELECT "id", "tag"
        FROM "extra"
        WHERE "userId" = ${userId} AND "type" = ${type} AND "entry"[1] = ${entry} AND "entry"[2] IS NULL
        `)

        if (r) {
          await db.query(sql`
          UPDATE "extra"
          SET "tag" = (
            SELECT array_agg(DISTINCT t)
            FROM (
              SELECT unnest("tag"||${tag}) t
            ) t1
          )
          WHERE "id" = ${r.id}
          `)

          refresh('entry_tag')

          reply.status(201)
          return {
            result: 'updated',
          }
        } else {
          const id = shortUUID.uuid()
          await db.query(sql`
          INSERT INTO "extra" ("entry", "tag", "type", "userId", "id")
          VALUES (${entry}, ${tag}, ${type}, ${userId}, ${id})
          `)

          refresh('entry_tag')

          reply.status(201)
          return {
            result: `created: ${id}`,
          }
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
          throw { statusCode: 401 }
        }

        const [r] = await db.query(sql`
        SELECT "id", "tag"
        FROM "extra"
        WHERE "userId" = ${userId} AND "type" = ${type} AND "entry"[1] = ${entry} AND "entry"[2] IS NULL
        `)

        if (r) {
          await db.query(sql`
          UPDATE "extra"
          SET "tag" = (
            SELECT array_agg(DISTINCT t)
            FROM (
              SELECT unnest("tag") t
            ) t1
            WHERE t != ANY(${tag})
          )
          WHERE "id" =${r.id}
          `)

          refresh('entry_tag')

          reply.status(201)
          return {
            result: 'updated',
          }
        } else {
          reply.status(200)
          return {
            result: `not updated`,
          }
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
          throw { statusCode: 401 }
        }

        const [x] = await db.query(sql`
        SELECT "type", "tag" FROM "extra"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `)

        if (!x) {
          throw { statusCode: 404 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          DELETE FROM "extra"
          WHERE "userId" = ${userId} AND "id" = ${id}
          `)
        })

        if (x.tag.length) {
          refresh('entry_tag')
        }

        switch (x.type) {
          case 'character':
            refresh('"character"')
            break
          case 'sentence':
            refresh('sentence')
        }

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
        entry: { ':': (v) => sql`extra."entry" &@ ${v}` },
        pinyin: { ':': (v) => sql`normalize_pinyin(extra."pinyin") &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin(extra."pinyin") &@ ${v}` },
        english: { ':': (v) => sql`extra."english" &@ ${v}` },
        type: { ':': (v) => sql`extra."type" = ${v}` },
        description: { ':': (v) => sql`extra."description" &@ ${v}` },
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
          throw { statusCode: 401 }
        }

        q = q.trim()

        const tagCond = makeTag.parse(q)
        const quizCond = makeQuiz.parse(q)

        const [r] = await db.query(sql`
        WITH match_cte AS (
          SELECT DISTINCT ON (t2."updatedAt", t2."createdAt", t2."id")
            "id",
            "entry",
            "reading",
            "english",
            "type",
            "tag"
          FROM (
            SELECT
              t1."id" "id",
              t1."list" "entry",
              t1."pinyin" "reading",
              t1."english" "english",
              t1."type" "type",
              t1."tag" "tag",
              t1."updatedAt" "updatedAt",
              t1."createdAt" "createdAt"
            FROM (
              SELECT
                "id",
                "entry" "list",
                unnest("entry") "entry",
                "pinyin",
                "english",
                "type",
                "tag",
                "updatedAt",
                "createdAt"
              FROM "extra"
              WHERE "userId" = ${userId}
                AND ${makeExtra.parse(q) || sql`TRUE`}
            ) t1
            ${
              quizCond
                ? sql`LEFT JOIN quiz ON quiz."entry" = t1."entry"`
                : sql``
            }
            ${
              tagCond
                ? sql`LEFT JOIN entry_tag ON entry_tag."entry" = t1."entry"`
                : sql``
            }
            WHERE TRUE
              ${quizCond ? sql`AND ${quizCond}` : sql``}
              ${tagCond ? sql`AND ${tagCond}` : sql``}
          ) t2
          ORDER BY t2."updatedAt" DESC, t2."createdAt" DESC, t2."id"
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
          result: r.result,
          count: r.count,
        }
      }
    )
  }
}

export default extraRouter

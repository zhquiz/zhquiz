import sql from '@databases/sql'
import toPinyin from 'chinese-to-pinyin'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { QSplit, qParseDate, qParseNum } from '../db/token'
import { db } from '../shared'

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

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const [r] = await db.query(sql`
        SELECT "entry", "pinyin", "english", "description", "tag", "type"
        FROM "extra"
        WHERE "userId" = ${userId} AND "id" = ${id}
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

        const userId: string = req.session.get('userId')
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
          reading.push(toPinyin(entry[0], { keepRest: true }))
        }

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "extra" ("entry", "pinyin", "english", "description", "tag", "type", "userId", "id")
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

        const userId: string = req.session.get('userId')
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
          reading.push(toPinyin(entry[0], { keepRest: true }))
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

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          DELETE FROM "extra"
          WHERE "userId" = ${userId} AND "id" = ${id}
          `)
        })

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
          entry: S.list(S.string()).minItems(1),
          reading: S.list(S.string()),
          english: S.list(S.string()),
          type: S.string().enum('character', 'vocabulary', 'sentence'),
          tag: S.list(S.string()),
        })
      ),
      count: S.integer(),
    })

    const makeQuiz = new QSplit({
      default: () => null,
      fields: {
        srsLevel: qParseNum(sql`quiz."srsLevel"`),
        nextReview: qParseDate(sql`quiz."nextReview"`),
        lastRight: qParseDate(sql`quiz."lastRight"`),
        lastWrong: qParseDate(sql`quiz."lastWrong"`),
        maxRight: qParseNum(sql`quiz."maxRight"`),
        maxWrong: qParseNum(sql`quiz."maxWrong"`),
        rightStreak: qParseNum(sql`quiz."rightStreak"`),
        wrongStreak: qParseNum(sql`quiz."wrongStreak"`),
      },
    })

    const makeExtra = new QSplit({
      default(v) {
        if (/^\p{sc=Han}+$/u.test(v)) {
          return sql.join(
            [
              this.fields.entry[':'](v),
              this.fields.description[':'](v),
              this.fields.tag[':'](v),
            ],
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
            this.fields.tag[':'](v),
          ],
          ' OR '
        )
      },
      fields: {
        entry: { ':': (v) => sql`extra."entry" &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin(extra."pinyin") &@ ${v}` },
        english: { ':': (v) => sql`extra."english" &@ ${v}` },
        type: { ':': (v) => sql`extra."type" = ${v}` },
        description: { ':': (v) => sql`extra."description" &@ ${v}` },
        tag: { ':': (v) => sql`extra."tag" &@ ${v}` },
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

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        q = q.trim()

        const quizCond = makeQuiz.parse(q)
        const $and = [
          sql`extra."userId" = ${userId}`,
          makeExtra.parse(q) || sql`TRUE`,
        ]
        if (quizCond) {
          $and.push(quizCond)
        }

        const result = await db.query(sql`
        SELECT
          extra."entry" "entry",
          extra."pinyin" "reading",
          extra."english" "english",
          extra."type" "type",
          extra."tag" "tag"
        FROM extra
        ${quizCond ? sql`LEFT JOIN quiz` : sql``}
        WHERE ${sql.join($and, ' AND ')}
        ORDER BY extra."updatedAt" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `)

        if (!result.length) {
          return {
            result: [],
            count: 0,
          }
        }
        const [rCount] = await db.query(sql`
        SELECT
          COUNT(*) "count"
        FROM extra
        ${quizCond ? sql`LEFT JOIN quiz` : sql``}
        WHERE ${sql.join($and, ' AND ')}
        `)

        return {
          result,
          count: rCount.count,
        }
      }
    )
  }
}

export default extraRouter

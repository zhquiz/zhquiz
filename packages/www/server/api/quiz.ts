import { SQLQuery, sql } from '@databases/pg'
import shuffle from 'array-shuffle'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { QSplit, qParseDate, qParseNum } from '../db/token'
import { db } from '../shared'
import { lookupCharacter } from './character'
import { lookupSentence } from './sentence'
import { makeReading } from './util'
import { lookupVocabulary } from './vocabulary'

const quizRouter: FastifyPluginAsync = async (f) => {
  {
    const sQueryQ = S.shape({
      id: S.string(),
      entry: S.string(),
      type: S.string(),
      direction: S.string(),
      select: S.string(),
    })

    const sResult = S.shape({
      result: S.list(S.object()),
    })

    f.get<{
      Querystring: typeof sQueryQ.type
    }>(
      '/',
      {
        schema: {
          operationId: 'quizGetOne',
          querystring: sQueryQ.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id, entry, type, direction, select } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const selMap: Record<string, SQLQuery> = {
          id: sql`"id"`,
          entry: sql`"entry"`,
          type: sql`"type"`,
          direction: sql`"direction"`,
        }

        const sel = select
          .split(',')
          .map((s) => selMap[s])
          .filter((s) => s)

        if (!sel.length || !(id || entry || type || direction)) {
          throw { statusCode: 400, message: 'not enough select' }
        }

        const result = await db.query(
          sql`
        SELECT ${sql.join(sel, ',')}
        FROM "quiz"
        WHERE "userId" = ${userId} AND ${sql.join(
            [
              ...(id ? [sql`"id" = ANY(${id})`] : []),
              ...(entry ? [sql`"entry" = ANY(${entry})`] : []),
              ...(type ? [sql`"type" = ${type}`] : []),
              ...(direction ? [sql`"direction" = ${direction}`] : []),
            ],
            ' AND '
          )}
        `
        )

        return { result }
      }
    )
  }

  {
    const sQuerystring = S.shape({
      q: S.string().optional(),
      page: S.integer(),
      limit: S.integer(),
      sort: S.string(),
      sortDirection: S.string().enum('asc', 'desc'),
    })

    const sResult = S.shape({
      result: S.list(S.object()),
      count: S.integer(),
    })

    f.get<{
      Querystring: typeof sQuerystring.type
    }>(
      '/leech',
      {
        schema: {
          operationId: 'quizListLeech',
          querystring: sQuerystring.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q = '', page, limit, sort, sortDirection } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const sortMap: Record<string, SQLQuery> = {
          entry: sql`"entry"`,
          type: sql`"type"`,
          direction: sql`"direction"`,
          srsLevel: sql`"srsLevel"`,
        }

        const directionMap: Record<string, SQLQuery> = {
          asc: sql`ASC`,
          desc: sql`DESC`,
        }

        let sortSQL = sortMap[sort]
        if (sortSQL) {
          sortSQL = sql`${sortSQL} ${directionMap[sortDirection] || sql``}`
        } else {
          sortSQL = sql`"wrongStreak" DESC, "lastRight" DESC`
        }

        const [rCount] = await db.query(
          sql`
        SELECT COUNT(*) "count"
        FROM "quiz"
        WHERE "userId" = ${userId} AND "wrongStreak" >= 2 AND ${parseQ(
            q,
            userId
          )}
        `
        )

        if (!rCount) {
          return {
            result: [],
            count: 0,
          }
        }

        const result = await db.query(
          sql`
        SELECT ${sql.join(
          [
            sql`"id"`,
            sql`"entry"`,
            sql`"type"`,
            sql`"direction"`,
            sql`"srsLevel"`,
          ],
          ','
        )}
        FROM "quiz"
        WHERE "userId" = ${userId} AND "wrongStreak" >= 2 AND ${parseQ(
            q,
            userId
          )}
        ORDER BY ${sortSQL}
        OFFSET ${(page - 1) * limit}
        LIMIT ${limit}
        `
        )

        return {
          result,
          count: rCount.count,
        }
      }
    )
  }

  {
    const sQuerystring = S.shape({
      q: S.string().optional(),
      type: S.string(),
      stage: S.string(),
      direction: S.string(),
      includeUndue: S.boolean(),
    })

    const sResult = S.shape({
      quiz: S.list(
        S.shape({
          nextReview: S.string().format('date-time').optional(),
          srsLevel: S.integer().optional(),
          wrongStreak: S.integer().optional(),
          id: S.string(),
        })
      ),
      upcoming: S.list(
        S.shape({
          nextReview: S.string().format('date-time').optional(),
          id: S.string(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuerystring.type
    }>(
      '/init',
      {
        schema: {
          operationId: 'quizInit',
          querystring: sQuerystring.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q = '', type, stage, direction, includeUndue } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const orCond: SQLQuery[] = []
        const stageSet = new Set(stage.split(','))
        if (stageSet.has('new')) {
          orCond.push(sql`"srsLevel" IS NULL`)
        }
        if (stageSet.has('learning')) {
          orCond.push(sql`"srsLevel" < 3`)
        }
        if (stageSet.has('graduated')) {
          orCond.push(sql`"srsLevel" >= 3`)
        }

        let cond = sql`(${sql.join([...orCond, sql`TRUE`], ' OR ')})`
        if (stageSet.has('leech')) {
          cond = sql`${cond} AND "wrongStreak" <= 2`
        }

        const result = await db.query(
          sql`
        SELECT
          "nextReview",
          "srsLevel",
          "wrongStreak",
          "id"
        FROM "quiz"
        WHERE "userId" = ${userId}
          AND "type" = ANY(${type.split(',')})
          AND "direction" = ANY(${direction.split(',')})
          AND ${cond}
          AND ${parseQ(q, userId)}
        `
        )

        const now = new Date()
        const quiz: {
          nextReview?: string
          srsLevel?: number
          wrongStreak?: number
          id: string
        }[] = []
        const upcoming: {
          nextReview?: string
          id: string
        }[] = []

        result.map((r) => {
          let nextReview = r.nextReview || undefined
          if (nextReview) {
            nextReview = nextReview.toISOString()
          }

          if (includeUndue) {
            quiz.push({
              nextReview,
              srsLevel: r.srsLevel || undefined,
              wrongStreak: r.wrongStreak || undefined,
              id: r.id,
            })
            return
          }

          if (!r.nextReview || r.nextReview < now) {
            quiz.push({
              nextReview,
              srsLevel: r.srsLevel || undefined,
              wrongStreak: r.wrongStreak || undefined,
              id: r.id,
            })
          } else {
            upcoming.push({
              nextReview,
              id: r.id,
            })
          }
        })

        return {
          quiz: shuffle(quiz),
          upcoming,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
      dLevel: S.integer().enum(0, 1, -1),
    })

    const sResult = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
    }>(
      '/updateSrsLevel',
      {
        schema: {
          operationId: 'quizUpdateSrsLevel',
          querystring: sQuery.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id, dLevel } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const [r] = await db.query(sql`
        SELECT "srsLevel", "rightStreak", "wrongStreak", "maxRight", "maxWrong"
        FROM "quiz"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `)
        if (!r) {
          throw { statusCode: 404 }
        }

        const srsLevel: number = (r.srsLevel || 0) + dLevel
        let rightStreak: number = r.rightStreak || 0
        let wrongStreak: number = r.wrongStreak || 0
        let maxRight: number = r.maxRight || 0
        let maxWrong: number = r.maxWrong || 0
        let lastRight: Date | null = null
        let lastWrong: Date | null = null

        const toAdd: [number, dayjs.OpUnitType] = ([
          [4, 'h'],
          [8, 'h'],
          [1, 'd'],
          [3, 'd'],
          [1, 'w'],
          [2, 'w'],
          [4, 'w'],
          [16, 'w'],
        ][srsLevel] || [1, 'h']) as [number, dayjs.OpUnitType]
        const nextReview = dayjs().add(toAdd[0], toAdd[1]).toDate()

        if (dLevel > 0) {
          rightStreak++
          wrongStreak = 0

          if (rightStreak > maxRight) {
            maxRight = rightStreak
          }

          lastRight = new Date()
        } else if (dLevel < 0) {
          wrongStreak++
          rightStreak = 0

          if (wrongStreak > maxWrong) {
            maxWrong = wrongStreak
          }

          lastWrong = new Date()
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "quiz"
          SET ${sql.join(
            [
              sql`"srsLevel" = ${srsLevel}`,
              sql`"nextReview" = ${nextReview}`,
              sql`"maxRight" = ${maxRight}`,
              sql`"maxWrong" = ${maxWrong}`,
              sql`"rightStreak" = ${rightStreak}`,
              sql`"wrongStreak" = ${wrongStreak}`,
              ...(lastRight ? [sql`"lastRight" = ${lastRight}`] : []),
              ...(lastWrong ? [sql`"lastWrong" = ${lastWrong}`] : []),
            ],
            ','
          )}
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

    const sResult = S.shape({
      ids: S.list(S.string()),
    })

    f.put<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'quizCreate',
          querystring: sQuery.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { entry, type } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const entries = entry.split(',')

        const missingEntries = await Promise.all(
          entries.map(async (el) => {
            switch (type) {
              case 'character':
                return lookupCharacter(el, userId).then(async (r) =>
                  r ? null : { entry: el, reading: await makeReading(el) }
                )
              case 'sentence':
                return lookupSentence(el, userId).then(async (r) =>
                  r ? null : { entry: el, reading: await makeReading(el) }
                )
            }

            return lookupVocabulary(el, userId).then(async (r) =>
              r ? null : { entry: el, reading: await makeReading(el) }
            )
          })
        ).then((rs) => rs.filter((r) => r).map((r) => r!))

        if (missingEntries.length) {
          await db.tx(async (db) => {
            await db.query(sql`
            INSERT INTO "extra" ("entry", "pinyin", "userId", "id")
            VALUES ${sql.join(
              missingEntries.map(
                (it) =>
                  sql`(${[it.entry]}, ${[it.reading]}, ${[
                    userId,
                  ]}, ${shortUUID.generate()})`
              ),
              ','
            )}
            `)
          })
        }

        const ids: string[] = []
        let dirs = ['entry-first', 'reading-first', 'english-first']
        if (type === 'sentence') {
          dirs = ['entry-first', 'english-first']
        }

        await db.tx(async (db) => {
          await db.query(sql`
          INSERT INTO "quiz" ("entry", "type", "direction", "userId", "id")
          VALUES ${sql.join(
            entries
              .flatMap((el) => dirs.map((dir) => ({ dir, el })))
              .map(({ dir, el }) => {
                const id = shortUUID.generate()
                ids.push(id)
                return sql`(${el}, ${type}, ${dir}, ${userId}, ${id})`
              }),
            ','
          )}
          `)
        })

        reply.status(201)
        return { ids }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string().optional(),
      entry: S.string().optional(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          entry: S.string(),
          srsLevel: S.integer(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/srsLevel',
      {
        schema: {
          operationId: 'quizGetSrsLevel',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id, entry, type } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        let cond: SQLQuery
        if (id) {
          cond = sql`"id" = ANY(${id.split(',')})`
        } else if (entry) {
          const entries = entry.split(',')
          cond = sql`"type" = ${type} AND "entry" = ANY(${entries})`
        } else {
          throw { statusCode: 400, message: 'either id or entry must exists' }
        }

        const result = await db.query(sql`
        SELECT
          "id",
          "entry",
          "srsLevel"
        FROM "quiz"
        WHERE "userId" = ${userId} AND ${cond} AND "srsLevel" IS NOT NULL
        `)

        return { result }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string().optional(),
      entry: S.string().optional(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
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
          operationId: 'quizDelete',
          querystring: sQuery.valueOf(),
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id, entry, type } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        let cond: SQLQuery
        if (id) {
          cond = sql`"id" = ANY(${id.split(',')})`
        } else if (entry) {
          const entries = entry.split(',')
          cond = sql`"type" = ${type} AND "entry" = ANY(${entries})`
        } else {
          throw { statusCode: 400, message: 'either id or entry must exists' }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          DELETE FROM "quiz"
          WHERE "userId" = ${userId} AND ${cond}
          `)
        })

        reply.status(201)
        return {
          result: 'deleted',
        }
      }
    )
  }

  function parseQ(q: string, userId: string): SQLQuery {
    if (!q.trim()) {
      return sql`TRUE`
    }

    const makeExtra = new QSplit({
      default(v) {
        return sql`(${sql.join(
          [
            this.fields.entry[':'](v),
            this.fields.description[':'](v),
            this.fields.tag[':'](v),
          ],
          ' OR '
        )})`
      },
      fields: {
        entry: {
          ':': (v) => sql`"entry" &@ ${v}`,
        },
        description: { ':': (v) => sql`"description" &@ ${v}` },
        tag: { ':': (v) => sql`${v} = ANY("tag")` },
      },
    })

    const makeQuiz = new QSplit({
      default: () => sql`TRUE`,
      fields: {
        type: { ':': (v) => sql`"type" = ${v}` },
        direction: { ':': (v) => sql`"direction" = ${v}` },
        srsLevel: qParseNum(sql`"srsLevel"`),
        nextReview: qParseDate(sql`"nextReview"`),
        lastRight: qParseDate(sql`"lastRight"`),
        lastWrong: qParseDate(sql`"lastWrong"`),
        maxRight: qParseNum(sql`"maxRight"`),
        maxWrong: qParseNum(sql`"maxWrong"`),
        rightStreak: qParseNum(sql`"rightStreak"`),
        wrongStreak: qParseNum(sql`"wrongStreak"`),
        createdAt: qParseNum(sql`"createdAt"`),
        updatedAt: qParseNum(sql`"updatedAt"`),
      },
    })

    const cond = [makeQuiz.parse(q) || sql`TRUE`]
    const exCond = makeExtra.parse(q)
    if (exCond) {
      cond.push(sql`${sql`"entry"`} IN (
        SELECT unnest(${sql`"entry"`})
        FROM "extra" WHERE "userId" = ${userId}} ${exCond}
      )`)
    }

    return sql.join(cond, ' AND ')
  }
}

export default quizRouter

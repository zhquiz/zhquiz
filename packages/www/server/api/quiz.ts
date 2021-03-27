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
    const sBody = S.shape({
      id: S.list(S.string()).optional(),
      entry: S.list(S.string()).optional(),
      type: S.string().optional(),
      direction: S.string().optional(),
      select: S.list(S.string()),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          entry: S.string(),
          type: S.string(),
          direction: S.string(),
        }).partial()
      ),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/getMany',
      {
        schema: {
          operationId: 'quizGetMany',
          body: sBody.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id, entry, type, direction, select } = req.body

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

        const sel = select.map((s) => selMap[s]).filter((s) => s)

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
    const sBody = S.shape({
      q: S.string().optional(),
      type: S.list(S.string()),
      stage: S.list(S.string()),
      direction: S.list(S.string()),
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

    f.post<{
      Body: typeof sBody.type
    }>(
      '/init',
      {
        schema: {
          operationId: 'quizInit',
          body: sBody.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q = '', type, stage, direction, includeUndue } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        db.query(
          sql`
        UPDATE "user"
        SET "quiz.settings" = ${req.body}
        WHERE "id" = ${userId}
        `
        )

        const orCond: SQLQuery[] = []
        const stageSet = new Set(stage)
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
        if (!stageSet.has('leech')) {
          cond = sql`${cond} AND ("wrongStreak" <= 2 OR "wrongStreak" IS NULL)`
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
          AND "type" = ANY(${type})
          AND "direction" = ANY(${direction})
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
      dLevel: S.integer(),
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
    const sBody = S.shape({
      entry: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          ids: S.list(S.string()),
          entry: S.string(),
        })
      ),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'quizCreate',
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { entry: entries, type } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const lookups: {
          entry: string
          alt?: string[]
          reading?: string[]
          english: string[]
          type: string
        }[] = await Promise.all(
          entries.map(async (el) => {
            switch (type) {
              case 'character':
                return lookupCharacter(el, userId).then(async (r) => ({
                  ...(r || {
                    entry: el,
                    reading: [await makeReading(el)],
                    english: [],
                  }),
                  type,
                }))
              case 'sentence':
                return lookupSentence(el, userId).then(async (r) => ({
                  ...(r || {
                    entry: el,
                    reading: [await makeReading(el)],
                    english: [],
                  }),
                  type,
                }))
            }

            return lookupVocabulary(el, userId).then(async (r) => ({
              ...(r || {
                entry: el,
                reading: [await makeReading(el)],
                english: [],
              }),
              type,
            }))
          })
        )
        const missingEntries = lookups.filter((r) => !r.english.length)

        if (missingEntries.length) {
          await db.tx(async (db) => {
            await db.query(sql`
            INSERT INTO "extra" ("entry", "pinyin", "userId", "id", "type")
            VALUES ${sql.join(
              missingEntries.map(
                (it) =>
                  sql`(${[it.entry]}, ${it.reading || []}, ${[
                    userId,
                  ]}, ${shortUUID.uuid()}, ${it.type})`
              ),
              ','
            )}
            `)
          })
        }

        const hasTeMap = new Map<string, string[]>()
        lookups.map((it) => {
          if (it.type === 'vocabulary' && it.alt?.length) {
            hasTeMap.set(it.entry, it.alt || [])
          }
        })

        const ids = new Map<string, string[]>()

        await db.tx(async (db) => {
          await db.query(sql`
          INSERT INTO "quiz" ("entry", "type", "direction", "userId", "id")
          VALUES ${sql.join(
            entries
              .flatMap((el) => {
                const dirs = ['se', 'ec'].map((dir) => ({ dir, el }))
                const te = hasTeMap.get(el)
                if (te) {
                  te.map((it) => dirs.push({ dir: 'te', el: it }))
                }

                return dirs
              })
              .map(({ dir, el }) => {
                const id = shortUUID.uuid()

                const v = ids.get(el) || []
                v.push(id)
                ids.set(el, v)

                return sql`(${el}, ${type}, ${dir}, ${userId}, ${id})`
              }),
            ','
          )}
          ON CONFLICT DO NOTHING
          `)
        })

        reply.status(201)
        return {
          result: Array.from(ids).map(([entry, ids]) => ({ entry, ids })),
        }
      }
    )
  }

  {
    const sBody = S.shape({
      id: S.list(S.string()).optional(),
      entry: S.list(S.string()).optional(),
      type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
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

    f.post<{
      Body: typeof sBody.type
    }>(
      '/getSrsLevel',
      {
        schema: {
          operationId: 'quizGetSrsLevel',
          body: sBody.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id, entry, type } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        let cond: SQLQuery
        if (id) {
          cond = sql`"id" = ANY(${id})`
        } else if (entry && type) {
          cond = sql`"type" = ${type} AND "entry" = ANY(${entry})`
        } else {
          throw { statusCode: 400, message: 'either id or entry must exists' }
        }

        const result = await db.query(sql`
        SELECT
          "id",
          "entry",
          COALESCE("srsLevel", -1) "srsLevel"
        FROM "quiz"
        WHERE "userId" = ${userId} AND ${cond}
        `)

        return { result }
      }
    )
  }

  {
    const sBody = S.shape({
      id: S.list(S.string()).optional(),
      entry: S.list(S.string()).optional(),
      type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
    })

    const sResult = S.shape({
      result: S.string(),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/deleteMany',
      {
        schema: {
          operationId: 'quizDeleteMany',
          body: sBody.valueOf(),
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id, entry, type } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        let cond: SQLQuery
        if (id) {
          cond = sql`"id" = ANY(${id})`
        } else if (entry && type) {
          cond = sql`"type" = ${type} AND "entry" = ANY(${entry})`
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
          [this.fields.entry[':'](v), this.fields.description[':'](v)],
          ' OR '
        )})`
      },
      fields: {
        entry: {
          ':': (v) => sql`"entry" &@ ${v}`,
        },
        description: { ':': (v) => sql`"description" &@ ${v}` },
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

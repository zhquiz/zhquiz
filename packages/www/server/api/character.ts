import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { db } from '../shared'

const characterRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      sub: S.list(S.string()),
      sup: S.list(S.string()),
      var: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/radical',
      {
        schema: {
          operationId: 'characterRadical',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const [rad] = await db.query(sql`
        SELECT "sub", "sup", "var" FROM dict.radical
        WHERE "entry" = ${entry}
        `)

        return {
          sub: rad?.sub || [],
          sup: rad?.sup || [],
          var: rad?.var || [],
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/vocabulary',
      {
        schema: {
          operationId: 'characterVocabulary',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const fThreshold = 1

        const result = await db.query(sql`
        SELECT "entry"[1] "entry"
        FROM vocabulary
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND frequency > ${fThreshold} AND "entry" &@ ${entry}
        ORDER BY RANDOM()
        LIMIT ${limit}
        `)

        if (result.length < limit) {
          req.log.info(
            `result.length = ${result.length}. Getting rarer entries.`
          )

          result.push(
            ...(await db.query(sql`
          SELECT "entry"[1] "entry"
          FROM vocabulary
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND NOT (frequency > ${fThreshold}) AND "entry" &@ ${entry}
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
        }

        return {
          result,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          english: S.string(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/sentence',
      {
        schema: {
          operationId: 'characterSentence',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const result = await db.query(sql`
        SELECT "entry", "english"[1] "english"
        FROM sentence
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND "entry" &@ ${entry} AND NOT "isTrad"
        ORDER BY RANDOM()
        LIMIT ${limit}
        `)

        if (result.length < limit) {
          result.push(
            ...(await db.query(sql`
          SELECT "entry", "english"[1] "english"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry} AND "isTrad"
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
        }

        return {
          result,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      entry: S.string(),
      reading: S.list(S.string()),
      english: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/entry',
      {
        schema: {
          operationId: 'characterGetByEntry',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const [r] = await db.query(sql`
        SELECT "entry", "pinyin" "reading", "english"
        FROM "character"
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND "entry" = ${entry}
        `)

        if (!r) {
          throw { statusCode: 404 }
        }

        return r
      }
    )
  }

  {
    const sResult = S.shape({
      result: S.string(),
      english: S.string(),
      level: S.integer(),
    })

    f.get(
      '/random',
      {
        schema: {
          operationId: 'characterRandom',
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const [u] = await db.query(sql`
        SELECT "level.min", "level.max" FROM "user" WHERE "id" = ${userId}
        `)

        if (!u) {
          throw { statusCode: 401 }
        }

        u['level.min'] = u['level.min'] || 1
        u['level.max'] = u['level.max'] || 10

        const [r] = await db.query(sql`
        SELECT "entry" "result", "level", (
          SELECT "english"
          FROM "character" c
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND c."entry" = t1."entry"
        ) "english"
        FROM (
          SELECT "entry", "hLevel" "level"
          FROM dict.zhlevel
          WHERE "hLevel" >= ${u['level.min']} AND "hLevel" <= ${u['level.max']}
          ORDER BY RANDOM()
          LIMIT 1
        ) t1
        `)

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          result: r.result,
          english: (r.english || ['???']).join(' / '),
          level: r.level,
        }
      }
    )
  }

  {
    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          level: S.integer(),
        })
      ),
    })

    f.get(
      '/level',
      {
        schema: {
          operationId: 'characterListLevel',
          response: { 200: sResult.valueOf() },
        },
      },
      async (): Promise<typeof sResult.type> => {
        const result: {
          entry: string
          level: number
        }[] = await db.query(sql`
        SELECT "entry", "hLevel" "level"
        FROM dict.zhlevel
        WHERE "hLevel" IS NOT NULL
        `)

        return {
          result,
        }
      }
    )
  }
}

export default characterRouter

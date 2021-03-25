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
        WHERE frequency > ${fThreshold} AND "entry" &@ ${entry}
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
          WHERE NOT (frequency > ${fThreshold}) AND "entry" &@ ${entry}
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
        WHERE "entry" &@ ${entry}
        ORDER BY RANDOM()
        LIMIT ${limit}
        `)

        return {
          result,
        }
      }
    )
  }
}

export default characterRouter

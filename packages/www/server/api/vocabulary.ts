import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { db } from '../shared'

const vocabularyRouter: FastifyPluginAsync = async (f) => {
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
          operationId: 'vocabularySentence',
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

        const result = await db.query(sql`
        SELECT "entry", "english"[1] "english"
        FROM sentence
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND to_tsvector('jiebaqry', "entry") @@ to_tsquery('jiebaqry', ${entry}) AND NOT "isTrad"
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
          ) AND to_tsvector('jiebaqry', "entry") @@ to_tsquery('jiebaqry', ${entry}) AND "isTrad"
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
        }

        if (result.length < limit) {
          result.push(
            ...(await db.query(sql`
          SELECT "entry", "english"[1] "english"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry} AND NOT "isTrad" AND NOT "entry" = ANY(${result.map(
              (r) => r.entry
            )})
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
        }

        if (result.length < limit) {
          result.push(
            ...(await db.query(sql`
          SELECT "entry", "english"[1] "english"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry} AND "isTrad" AND NOT "entry" = ANY(${result.map(
              (r) => r.entry
            )})
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
}

export default vocabularyRouter

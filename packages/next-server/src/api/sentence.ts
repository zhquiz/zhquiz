import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zh } from '../db/chinese'
import { QuizModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getMatch()
  matchQ()
  getRandom()

  next()

  function getMatch() {
    const sQuery = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      chinese: S.string(),
      pinyin: S.string().optional(),
      english: S.string()
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/match',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const { entry } = req.query

        const result = zh.db
          .prepare(
            /* sql */ `
        SELECT chinese, pinyin, english
        FROM sentence
        WHERE chinese = @entry
        `
          )
          .get({ entry })

        if (!result) {
          reply.status(404)
          return {
            error: 'not found'
          }
        }

        const { chinese, pinyin, english } = result

        return {
          chinese,
          pinyin: pinyin || makePinyin(entry, { keepRest: true }),
          english
        }
      }
    )
  }

  function matchQ() {
    const sQuery = S.shape({
      q: S.string()
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          chinese: S.string(),
          pinyin: S.string().optional(),
          english: S.string()
        })
      ),
      count: S.integer().optional()
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (req): Promise<typeof sResponse.type> => {
        const { q } = req.query

        const result = zh.db
          .prepare(
            /* sql */ `
        SELECT chinese, pinyin, english
        FROM sentence s
        JOIN sentence_token st ON st.sentence_id = s.id
        WHERE st.entry = @q
        GROUP BY chinese
        ORDER BY RANDOM()
        LIMIT 10
        `
          )
          .all({ q })
          .map(({ chinese, pinyin, english }) => {
            if (!pinyin) {
              pinyin = makePinyin(chinese, { keepRest: true })
            }

            return { chinese, pinyin, english }
          })

        return {
          result
        }
      }
    )
  }

  function getRandom() {
    const sQuery = S.shape({
      level: S.integer().optional()
    })

    const sResponse = S.shape({
      result: S.string().optional(),
      english: S.string().optional(),
      level: S.integer().optional()
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/random',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const reviewing = await QuizModel.find({
          userId,
          type: 'sentence',
          nextReview: { $exists: true }
        })
          .select('entry')
          .then((its) => its.map((it) => it.entry))

        const { level = 60 } = req.query

        const s = zh.db
          .prepare(
            /* sql */ `
        SELECT chinese, english, [level]
        FROM sentence
        WHERE
          chinese NOT IN (${Array(reviewing.length).fill('?')}) AND
          [level] <= ?
        ORDER BY RANDOM()
        `
          )
          .get([...reviewing, level])

        if (!s) {
          reply.status(404)
          return {
            error: 'no sentence found'
          }
        }

        return {
          result: s.chinese,
          english: s.english,
          level: s.level
        }
      }
    )
  }
}

import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zh } from '../db/chinese'
import { QuizModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getQ()
  getMatch()
  getRandom()
  getLevel()

  next()

  function getQ() {
    const sQuery = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          simplified: S.string(),
          traditional: S.string().optional(),
          pinyin: S.string(),
          english: S.string()
        })
      )
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
        const { entry } = req.query

        const result = zh.db
          .prepare(
            /* sql */ `
        SELECT simplified, traditional, pinyin, english
        FROM cedict
        WHERE
          simplified LIKE '%'||@entry||'%' OR
          traditional LIKE '%'||@entry||'%'
        ORDER BY frequency DESC
        LIMIT 10
        `
          )
          .all({ entry })
          .map((it) => ({
            ...it,
            traditional: it.traditional || undefined
          }))

        return {
          result
        }
      }
    )
  }

  function getMatch() {
    const sQuery = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      vocabs: S.list(
        S.shape({
          simplified: S.string(),
          traditional: S.string().optional(),
          pinyin: S.string(),
          english: S.string()
        })
      ),
      sentences: S.list(
        S.shape({
          chinese: S.string(),
          pinyin: S.string().optional(),
          english: S.string()
        })
      )
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
      async (req): Promise<typeof sResponse.type> => {
        const { entry } = req.query

        const vocabs = zh.db
          .prepare(
            /* sql */ `
        SELECT simplified, traditional, pinyin, english
        FROM cedict
        WHERE
          simplified = @entry OR
          traditional = @entry
        ORDER BY frequency DESC
        `
          )
          .all({ entry })
          .map((it) => ({
            ...it,
            traditional: it.traditional || undefined
          }))

        const sentences = zh.db
          .prepare(
            /* sql */ `
        SELECT chinese, pinyin, english
        FROM sentence s
        JOIN sentence_token st ON st.sentence_id = s.id
        WHERE st.entry = @entry
        GROUP BY chinese
        ORDER BY RANDOM()
        LIMIT 10
        `
          )
          .all({ entry })
          .map((it) => ({
            ...it,
            pinyin: it.pinyin || makePinyin(entry, { keepRest: true })
          }))

        return {
          vocabs,
          sentences
        }
      }
    )
  }

  function getRandom() {
    const sQuery = S.shape({
      level: S.integer().optional(),
      levelMin: S.integer().optional()
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
          type: 'vocab',
          nextReview: { $exists: true }
        })
          .select('entry')
          .then((its) => its.map((it) => it.entry))

        const { level } = req.query

        const v = zh.db
          .prepare(
            /* sql */ `
        SELECT simplified, GROUP_CONCAT(english, '; ') english, vocab_level [level]
        FROM cedict ce
        JOIN token t ON t.entry = ce.simplified
        WHERE
          simplified NOT IN (${Array(reviewing.length).fill('?')}) AND
          [level] <= ?
        GROUP BY simplified
        ORDER BY RANDOM()
        `
          )
          .get([...reviewing, level])

        if (!v) {
          reply.status(404)
          return {
            error: 'no vocab found'
          }
        }

        return {
          result: v.simplified,
          english: v.english,
          level: v.level
        }
      }
    )
  }

  function getLevel() {
    const sResponse = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          level: S.integer().optional(),
          srsLevel: S.integer().optional()
        })
      )
    })

    f.get(
      '/level',
      {
        schema: {
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

        const rs = zh.db
          .prepare(
            /* sql */ `
        SELECT [entry], vocab_level [level]
        FROM token
        WHERE vocab_level IS NOT NULL
        `
          )
          .all()

        const levelMap = new Map<string, number>()
        rs.map(({ entry, level }) => {
          levelMap.set(entry, level)
        })

        const result = await QuizModel.find({
          userId,
          entry: {
            $in: rs.map(({ entry }) => entry)
          },
          type: 'vocab'
        })
          .sort('-updatedAt')
          .then((qs) =>
            qs
              .map((q) => ({
                entry: q.entry,
                level: levelMap.get(q.entry)!,
                srsLevel: q.srsLevel
              }))
              .sort(({ level: lv1 }, { level: lv2 }) => lv1 - lv2)
          )

        return {
          result
        }
      }
    )
  }
}

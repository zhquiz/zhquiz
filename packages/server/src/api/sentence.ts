import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zhSentence } from '../db/local'
import { DbCardModel } from '../db/mongo'
import { checkAuthorize } from '../util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const isSimp = (s = '') => {
    const arr = [
      'simplified',
      'simplified-english',
      'traditional',
      'traditional-english',
    ]
    return -(arr.reverse().indexOf(s) + 1) / arr.length
  }

  postMatch()
  postQ()
  postRandom()

  next()

  function postMatch() {
    const sBody = S.shape({
      entry: S.string(),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          chinese: S.string(),
          pinyin: S.string().optional(),
          english: S.string(),
        })
      ),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/match',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry } = req.body

        return {
          result: zhSentence
            .find({
              chinese: entry,
            })
            .sort(({ type: t1 }, { type: t2 }) => {
              return isSimp(t1) - isSimp(t2) + 0.5 - Math.random()
            })
            .map(({ chinese, pinyin, english }) => {
              if (!pinyin) {
                pinyin = makePinyin(entry, { keepRest: true })
              }

              return { chinese, pinyin, english }
            }),
        }
      }
    )
  }

  function postQ() {
    const sBody = S.shape({
      entry: S.string(),
      offset: S.integer().optional(),
      limit: S.integer().optional(),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          chinese: S.string(),
          pinyin: S.string().optional(),
          english: S.string(),
        })
      ),
      count: S.integer().optional(),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/q',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry, offset = 0, limit = 10 } = req.body

        return {
          result: zhSentence
            .find({
              chinese: { $contains: entry },
            })
            .sort(({ type: t1 }, { type: t2 }) => {
              return isSimp(t1) - isSimp(t2) + 0.5 - Math.random()
            })
            .slice(offset, limit ? offset + limit : undefined)
            .map(({ chinese, pinyin, english }) => {
              if (!pinyin) {
                pinyin = makePinyin(entry, { keepRest: true })
              }

              return { chinese, pinyin, english }
            }),
          count: zhSentence.count({
            chinese: { $contains: entry },
          }),
        }
      }
    )
  }

  function postRandom() {
    const sBody = S.shape({
      levelMin: S.integer().optional(),
      level: S.integer().optional(),
    })

    const sResponse = S.shape({
      result: S.string().optional(),
      english: S.string().optional(),
      level: S.integer().optional(),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/random',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return {}
        }

        const reviewing: string[] = (
          await DbCardModel.aggregate([
            {
              $match: {
                userId,
                type: 'sentence',
              },
            },
            {
              $lookup: {
                from: 'quiz',
                localField: '_id',
                foreignField: 'cardId',
                as: 'q',
              },
            },
            {
              $match: { 'q.nextReview': { $exists: true } },
            },
            {
              $project: {
                _id: 0,
                item: 1,
              },
            },
          ])
        ).map((el) => el.item)

        const { levelMin, level } = req.body
        const getSentence = (type: any) => {
          const ss = zhSentence.find({
            $and: [
              { level: { $lte: level || 60 } },
              { level: { $gte: levelMin || 1 } },
              { chinese: { $nin: reviewing } },
              { type },
            ],
          })
          return ss[Math.floor(Math.random() * ss.length)]
        }

        const s =
          getSentence('simplified') ||
          getSentence('traditional') ||
          getSentence({ $nin: ['simplified', 'traditional'] }) ||
          {}

        return {
          result: s.chinese,
          english: s.english,
          level: s.level,
        }
      }
    )
  }
}

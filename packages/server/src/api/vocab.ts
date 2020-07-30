import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { hsk, zhSentence, zhVocab } from '@/db/local'
import { DbQuizModel } from '@/db/mongo'
import { checkAuthorize } from '@/util/api'

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

  getQ()
  getMatch()
  getRandom()
  getLevel()

  next()

  function getQ() {
    const sQuery = S.shape({
      entry: S.string(),
      offset: S.integer().optional(),
      limit: S.integer(),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          simplified: S.string(),
          traditional: S.string().optional(),
          pinyin: S.string(),
          english: S.string(),
        })
      ),
      count: S.integer().optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry, offset = 0, limit = 10 } = req.query

        return {
          result: zhVocab
            .find({
              $or: [
                { simplified: { $contains: entry } },
                { traditional: { $contains: entry } },
              ],
            })
            .sort(({ frequency: f1 = 0 }, { frequency: f2 = 0 }) => f2 - f1)
            .slice(offset, limit ? offset + limit : undefined)
            .map(({ simplified, traditional, pinyin, english }) => {
              if (!pinyin) {
                pinyin = makePinyin(simplified, { keepRest: true })
              }

              return { simplified, traditional, pinyin, english }
            }),
          count: zhVocab.count({
            $or: [
              { simplified: { $contains: entry } },
              { traditional: { $contains: entry } },
            ],
          }),
        }
      }
    )
  }

  function getMatch() {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResponse = S.shape({
      result: S.shape({
        vocabs: S.list(
          S.shape({
            simplified: S.string(),
            traditional: S.string().optional(),
            pinyin: S.string(),
            english: S.string(),
          })
        ),
        sentences: S.list(
          S.shape({
            chinese: S.string(),
            pinyin: S.string().optional(),
            english: S.string(),
          })
        ),
      }),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/match',
      {
        schema: {
          body: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry } = req.query

        return {
          result: {
            vocabs: zhVocab
              .find({
                $or: [{ simplified: entry }, { traditional: entry }],
              })
              .map(({ simplified, traditional, pinyin, english }) => {
                if (!pinyin) {
                  pinyin = makePinyin(simplified, { keepRest: true })
                }

                return { simplified, traditional, pinyin, english }
              }),
            sentences: zhSentence
              .find({
                chinese: { $contains: entry },
              })
              .sort(({ type: t1 }, { type: t2 }) => {
                return isSimp(t1) - isSimp(t2) + 0.5 - Math.random()
              })
              .slice(0, 10)
              .map(({ chinese, pinyin, english }) => {
                if (!pinyin) {
                  pinyin = makePinyin(entry, { keepRest: true })
                }

                return { chinese, pinyin, english }
              }),
          },
        }
      }
    )
  }

  function getRandom() {
    const sQuery = S.shape({
      level: S.integer().optional(),
      levelMin: S.integer().optional(),
    })

    const sResponse = S.shape({
      result: S.string().optional(),
      english: S.string().optional(),
      level: S.integer().optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/random',
      {
        schema: {
          body: sQuery.valueOf(),
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

        const { levelMin, level } = req.query

        let vs = Object.entries(hsk)
          .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
          .filter(({ lv }) => (level ? lv <= level : true))
          .filter(({ lv }) => (levelMin ? lv >= levelMin : true))
          .reduce(
            (prev, { lv, vs }) => [...prev, ...vs.map((v) => ({ v, lv }))],
            [] as {
              v: string
              lv: number
            }[]
          )

        const reviewing = new Set<string>(
          (
            await DbQuizModel.find({
              userId,
              entry: { $in: vs.map(({ v }) => v) },
              type: 'vocab',
              nextReview: { $exists: true },
            }).select('entry')
          ).map((el) => el.entry)
        )

        vs = vs.filter(({ v }) => !reviewing.has(v))
        if (vs.length === 0) {
          return {}
        }

        const v = vs[Math.floor(Math.random() * vs.length)] || {}

        const r =
          zhVocab.findOne({
            simplified: v.v,
            // @ts-ignore
            english: { $exists: true },
          }) || ({} as any)

        return {
          result: v.v,
          english: r.english,
          level: v.lv,
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
          srsLevel: S.integer().optional(),
        })
      ),
    })

    f.get(
      '/level',
      {
        schema: {
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return {
            result: [],
          }
        }

        const hskLevelMap = new Map<string, number>()
        Object.entries(hsk).map(([_lv, vs]) => {
          const lv = parseInt(_lv)
          vs.map((v) => {
            hskLevelMap.set(v, lv)
          })
        })

        const r = await DbQuizModel.find({
          userId,
          entry: {
            $in: Array.from(hskLevelMap.keys()),
          },
          type: 'vocab',
          tag: 'hsk',
        })

        const srsLevelMap = new Map<string, number>()
        r.map(({ entry, srsLevel = -1 }) => {
          srsLevelMap.set(entry, srsLevel)
        })

        return {
          result: Array.from(hskLevelMap).map(([entry, level]) => ({
            entry,
            level,
            srsLevel: srsLevelMap.get(entry),
          })),
        }
      }
    )
  }
}

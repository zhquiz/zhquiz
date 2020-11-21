import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { hsk, zhToken } from '@/db/local'
import { DbQuizModel } from '@/db/mongo'
import { checkAuthorize } from '@/util/api'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getMatch()
  getRandom()

  next()

  function getMatch() {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResponse = S.shape({
      result: S.shape({
        sup: S.string().optional(),
        sub: S.string().optional(),
        variants: S.string().optional(),
        pinyin: S.string().optional(),
        english: S.string().optional(),
      }),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/match',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry } = req.query
        const { sub, sup, variants, pinyin, english } =
          zhToken.findOne({ entry }) || {}

        return {
          result: { sub, sup, variants, pinyin, english },
        }
      }
    )
  }

  function getRandom() {
    const sQuery = S.shape({
      levelMin: S.integer().optional(),
      level: S.integer().optional(),
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
          querystring: sQuery.valueOf(),
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

        const hsMap = new Map<string, number>()

        Object.entries(hsk)
          .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
          .filter(({ lv }) => (level ? lv <= level : true))
          .filter(({ lv }) => (levelMin ? lv >= levelMin : true))
          .map(({ lv, vs }) => {
            vs.map((v) => {
              v.split('').map((h) => {
                const hLevel = hsMap.get(h)
                if (!hLevel || hLevel > lv) {
                  hsMap.set(h, lv)
                }
              })
            })
          })

        const reviewing = new Set<string>(
          (
            await DbQuizModel.find({
              userId,
              entry: { $in: Array.from(hsMap.keys()) },
              type: 'hanzi',
              nextReview: { $exists: true },
            }).select('entry')
          ).map((el) => el.entry)
        )

        const hs = Array.from(hsMap).filter(([h]) => !reviewing.has(h))
        if (hs.length === 0) {
          return {}
        }

        const [h, lv] = hs[Math.floor(Math.random() * hs.length)]

        const r = zhToken.findOne({ entry: h })

        return {
          result: h,
          english: r ? r.english : undefined,
          level: lv,
        }
      }
    )
  }
}

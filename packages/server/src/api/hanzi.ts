import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { hsk, zhToken } from '../db/local'
import { DbCardModel } from '../db/mongo'
import { checkAuthorize } from '../util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  postMatch()
  postRandom()

  next()

  function postMatch() {
    const sBody = S.shape({
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
        const { sub, sup, variants, pinyin, english } =
          zhToken.findOne({ entry }) || {}

        return {
          result: { sub, sup, variants, pinyin, english },
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

        const { levelMin, level } = req.body

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
            await DbCardModel.aggregate([
              {
                $match: {
                  userId,
                  item: { $in: Array.from(hsMap.keys()) },
                  type: 'hanzi',
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

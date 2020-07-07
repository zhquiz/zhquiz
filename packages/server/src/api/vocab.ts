import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'

import { hsk, zhSentence, zhVocab } from '../db/local'
import { DbCardModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post(
    '/q',
    {
      schema: {
        tags: ['vocab'],
        summary: 'Query for a given vocab',
        body: {
          type: 'object',
          required: ['entry'],
          properties: {
            entry: { type: 'string' },
            offset: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['simplified', 'pinyin', 'english'],
                  properties: {
                    simplified: { type: 'string' },
                    traditional: { type: 'string' },
                    pinyin: { type: 'string' },
                    english: { type: 'string' },
                  },
                },
              },
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
            },
          },
        },
      },
    },
    async (req) => {
      const { entry, offset = 0, limit = 10 } = req.body

      return {
        result: zhVocab
          .find({
            $or: [
              { simplified: { $contains: entry } },
              { traditional: { $contains: entry } },
            ],
          })
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
        offset,
        limit,
      }
    }
  )

  f.post(
    '/match',
    {
      schema: {
        tags: ['vocab'],
        summary: 'Get translation for a given vocab',
        body: {
          type: 'object',
          required: ['entry'],
          properties: {
            entry: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
                type: 'object',
                properties: {
                  vocabs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        simplified: { type: 'string' },
                        traditional: { type: 'string' },
                        pinyin: { type: 'string' },
                        english: { type: 'string' },
                      },
                    },
                  },
                  sentences: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        chinese: { type: 'string' },
                        pinyin: { type: 'string' },
                        english: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (req) => {
      const { entry } = req.body

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
            .sort(() => 0.5 - Math.random())
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

  f.post(
    '/random',
    {
      schema: {
        tags: ['vocab'],
        summary: 'Randomize a vocab for a given level',
        body: {
          type: 'object',
          properties: {
            level: { type: 'integer' },
            levelMin: { type: 'integer' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: 'string' },
              english: { type: 'string' },
              level: { type: 'integer' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const u = req.session.user
      if (!u || !u._id) {
        reply.status(401).send()
        return
      }

      const { levelMin, level } = req.body

      let vs = Object.entries(hsk)
        .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
        .filter(({ lv }) => (level ? lv <= level : true))
        .filter(({ lv }) => (level ? lv >= levelMin : true))
        .reduce(
          (prev, { lv, vs }) => [...prev, ...vs.map((v) => ({ v, lv }))],
          [] as {
            v: string
            lv: number
          }[]
        )

      const reviewing = new Set<string>(
        (
          await DbCardModel.aggregate([
            {
              $match: {
                userId: u._id,
                item: { $in: vs.map(({ v }) => v) },
                type: 'vocab',
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

  f.post(
    '/all',
    {
      schema: {
        tags: ['vocab'],
        summary: 'Get all leveled vocabs',
        response: {
          200: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return hsk
    }
  )

  next()
}

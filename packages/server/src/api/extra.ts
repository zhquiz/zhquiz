import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zhSentence, zhToken, zhVocab } from '../db/local'
import { DbExtraModel } from '../db/mongo'
import { checkAuthorize } from '../util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  postQ()
  postMatch()
  doPut()
  doPatch()
  doDelete()

  next()

  function postQ() {
    const sBody = S.shape({
      cond: S.object().additionalProperties(true).optional(),
      projection: S.object().additionalProperties(S.integer()).optional(),
      sort: S.object().additionalProperties(S.integer()).optional(),
      offset: S.integer().optional(),
      limit: S.anyOf(S.integer(), S.null()).optional(),
      hasCount: S.boolean().optional(),
    })

    const sResponse = S.shape({
      result: S.list(S.object().additionalProperties(true)),
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
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return {
            result: [],
          }
        }

        const {
          cond = {},
          projection,
          sort = { updatedAt: -1 },
          offset = 0,
          limit = 10,
          hasCount = true,
        } = req.body

        const match = [{ $match: { userId } }, { $match: cond }]

        const [rData, rCount = []] = await Promise.all([
          DbExtraModel.aggregate([
            ...match,
            { $sort: sort },
            { $skip: offset },
            ...(limit ? [{ $limit: limit }] : []),
            ...(projection ? [{ $project: projection }] : []),
          ]),
          hasCount
            ? DbExtraModel.aggregate([...match, { $count: 'count' }])
            : undefined,
        ])

        return {
          result: rData,
          count: hasCount ? (rCount[0] || {}).count || 0 : undefined,
        }
      }
    )
  }

  function postMatch() {
    const sBody = S.shape({
      entry: S.string(),
    })

    const sResponse = S.shape({
      result: S.shape({
        chinese: S.string(),
        pinyin: S.string(),
        english: S.string(),
      }).optional(),
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
        const r = await DbExtraModel.findOne({ chinese: entry })

        return {
          result: r
            ? {
                chinese: r.chinese,
                pinyin: r.pinyin || makePinyin(r.chinese, { keepRest: true }),
                english: r.english,
              }
            : undefined,
        }
      }
    )
  }

  function doPut() {
    const sBody = S.shape({
      chinese: S.string(),
      pinyin: S.string().optional(),
      english: S.string(),
    })

    const sResponse = S.shape({
      type: S.string().optional(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
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

        const { chinese, pinyin, english } = req.body

        if (
          zhVocab.count({
            $or: [{ simplified: chinese }, { traditional: chinese }],
          }) > 0
        ) {
          return {
            type: 'vocab',
          }
        }

        if (zhSentence.count({ chinese }) > 0) {
          return {
            type: 'sentence',
          }
        }

        if (
          zhToken.count({
            entry: chinese,
            // @ts-ignore
            english: { $exists: true },
          })
        ) {
          return {
            type: 'hanzi',
          }
        }

        await DbExtraModel.create({
          userId,
          chinese,
          pinyin,
          english,
        })

        return {
          type: 'extra',
        }
      }
    )
  }

  function doPatch() {
    const sBody = S.shape({
      ids: S.list(S.string()),
      set: S.object().additionalProperties(true),
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: sBody.valueOf(),
        },
      },
      async (req, reply) => {
        const { ids, set } = req.body

        await DbExtraModel.updateMany(
          { _id: { $in: ids } },
          {
            $set: set,
          }
        )

        reply.status(201)
        return null
      }
    )
  }

  function doDelete() {
    const sBody = S.shape({
      ids: S.list(S.string()).minItems(1),
    })

    f.delete<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: sBody.valueOf(),
        },
      },
      async (req, reply) => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return null
        }

        const { ids } = req.body
        await DbExtraModel.purgeMany(userId, { _id: { $in: ids } })
        reply.status(201)
        return null
      }
    )
  }
}

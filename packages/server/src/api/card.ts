import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zhVocab } from '../db/local'
import { DbCardModel } from '../db/mongo'
import { checkAuthorize, restoreDate } from '../util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  postQ()
  doPut()
  doPatch()
  doDelete()

  next()

  /**
   * TODO: Remove generic method. Consider more specific than cond: any
   */
  function postQ() {
    const sBody = S.shape({
      cond: S.object().additionalProperties(true).optional(),
      projection: S.object().additionalProperties(S.integer()).optional(),
      sort: S.object().additionalProperties(S.integer()).optional(),
      offset: S.integer().optional(),
      limit: S.anyOf(S.integer(), S.null()).optional(),
      join: S.list(S.string()).optional(),
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
          join = [],
          hasCount = true,
        } = req.body

        const match = [
          { $match: { userId } },
          ...(join.includes('quiz')
            ? [
                {
                  $lookup: {
                    from: 'quiz',
                    localField: '_id',
                    foreignField: 'cardId',
                    as: 'q',
                  },
                },
                { $unwind: { path: '$q', preserveNullAndEmptyArrays: true } },
                {
                  $addFields: {
                    srsLevel: '$q.srsLevel',
                    nextReview: '$q.nextReview',
                    stat: '$q.stat',
                  },
                },
              ]
            : []),
          { $match: restoreDate(cond) },
        ]

        const [rData, rCount = []] = await Promise.all([
          DbCardModel.aggregate([
            ...match,
            { $sort: sort },
            { $skip: offset },
            ...(limit ? [{ $limit: limit }] : []),
            ...(projection ? [{ $project: projection }] : []),
          ]),
          hasCount
            ? DbCardModel.aggregate([...match, { $count: 'count' }])
            : undefined,
        ])

        return {
          result: rData,
          count: hasCount ? (rCount[0] || {}).count || 0 : undefined,
        }
      }
    )
  }

  function doPut() {
    const sBody = S.shape({
      item: S.string().optional(),
      entries: S.list(S.string()).minItems(1).optional(),
      type: S.string(),
    })

    f.put<{
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

        const { item: _item, entries, type } = req.body

        if (!_item && !entries) {
          reply.status(304)
          return null
        }

        const itemMap = new Map<
          string,
          {
            directions: string[]
          }
        >()

        ;(entries || [_item!]).map((it) => {
          const directions = ['se', 'ec']

          if (type === 'vocab') {
            const r = zhVocab.count({
              $or: [
                {
                  traditional: it,
                },
                {
                  simplified: it,
                  traditional: { $exists: true },
                },
              ],
            })

            if (r > 0) {
              directions.push('te')
            }
          }

          itemMap.set(it, { directions })
        })

        try {
          await DbCardModel.insertMany(
            Array.from(itemMap).reduce(
              (prev, [it, { directions }]) => [
                ...prev,
                ...directions.map((dir) => ({
                  userId,
                  item: it,
                  type,
                  direction: dir,
                })),
              ],
              [] as any[]
            ),
            { ordered: false }
          )
        } catch (e) {
          if (!e.result.insertedIds.length) {
            reply.status(304)
            return null
          }
        }

        reply.status(201)
        return null
      }
    )
  }

  /**
   * TODO: Remove generic method. Consider more specific than set: any
   */
  function doPatch() {
    const sBody = S.shape({
      id: S.string(),
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
        const { id, set } = req.body

        await DbCardModel.findByIdAndUpdate(id, {
          $set: set,
        })

        reply.status(201)
        return null
      }
    )
  }

  function doDelete() {
    const sBody = S.shape({
      id: S.anyOf(S.string(), S.list(S.string()).minItems(1)),
    })

    f.delete<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          // tags: ['card'],
          // summary: 'Delete a card',
          body: sBody.valueOf(),
        },
      },
      async (req, reply) => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return null
        }

        const { id } = req.body
        await DbCardModel.purgeMany(userId, {
          _id: { $in: Array.isArray(id) ? id : [id] },
        })

        reply.status(201)
        return null
      }
    )
  }
}

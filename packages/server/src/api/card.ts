import { FastifyInstance } from 'fastify'

import { zhVocab } from '../db/local'
import { DbCardModel } from '../db/mongo'
import { restoreDate } from '../util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post(
    '/q',
    {
      schema: {
        tags: ['card'],
        summary: 'Query for cards',
        body: {
          type: 'object',
          properties: {
            cond: { type: 'object' },
            projection: {
              type: 'object',
              additionalProperties: { type: 'number' },
            },
            sort: {
              type: 'object',
              additionalProperties: { type: 'number' },
            },
            offset: { type: 'integer' },
            limit: { type: ['integer', 'null'] },
            join: { type: 'array', items: { type: 'string' } },
            hasCount: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: 'array', items: {} },
              offset: { type: 'integer' },
              limit: { type: ['integer', 'null'] },
              count: { type: 'integer' },
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

      const {
        cond = {},
        projection,
        sort = { updatedAt: -1 },
        offset = 0,
        limit = 10,
        join = [] as string[],
        hasCount = true,
      } = req.body

      const match = [
        { $match: { userId: u._id } },
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
        offset,
        limit,
        count: hasCount ? (rCount[0] || {}).count || 0 : undefined,
      }
    }
  )

  f.put(
    '/',
    {
      schema: {
        tags: ['card'],
        summary: 'Create a card',
        body: {
          type: 'object',
          required: ['type'],
          properties: {
            item: { type: 'string' },
            entries: { type: 'array', minItems: 1, items: { type: 'string' } },
            type: { type: 'string' },
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

      const { item: _item, entries, type } = req.body

      if (!_item && !entries) {
        reply.status(304).send()
        return
      }

      const itemMap = new Map<
        string,
        {
          directions: string[]
        }
      >()

      ;(entries || [_item]).map((it: string) => {
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
                userId: u._id,
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
          reply.status(304).send()
          return
        }
      }

      reply.status(201).send()
    }
  )

  f.patch(
    '/',
    {
      schema: {
        tags: ['card'],
        summary: 'Update a card',
        body: {
          type: 'object',
          required: ['id', 'set'],
          properties: {
            id: { type: 'string' },
            set: { type: 'object' },
          },
        },
      },
    },
    async (req, reply) => {
      const { id, set } = req.body

      await DbCardModel.findByIdAndUpdate(id, {
        $set: set,
      })

      reply.status(201).send()
    }
  )

  f.delete(
    '/',
    {
      schema: {
        tags: ['card'],
        summary: 'Delete a card',
        body: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              anyOf: [
                { type: 'string' },
                { type: 'array', minItems: 1, items: { type: 'string' } },
              ],
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

      const { id } = req.body
      await DbCardModel.purgeMany(u._id, {
        _id: { $in: Array.isArray(id) ? id : [id] },
      })

      reply.status(201).send()
    }
  )

  next()
}

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
          required: ['item', 'type'],
          properties: {
            item: { type: 'string' },
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

      const { item, type } = req.body
      const directions = ['se', 'ec']

      if (type === 'vocab') {
        const r = zhVocab.count({
          $or: [
            {
              traditional: item,
            },
            {
              simplified: item,
              traditional: { $exists: true },
            },
          ],
        })

        if (r > 0) {
          directions.push('te')
        }
      }

      await Promise.all(
        directions.map((direction) =>
          DbCardModel.create({
            userId: u._id,
            item,
            type,
            direction,
          })
        )
      )

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
            id: { type: 'string' },
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
      await DbCardModel.purgeMany(u._id, { _id: id })

      reply.status(201).send()
    }
  )

  next()
}

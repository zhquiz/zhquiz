import { FastifyInstance } from 'fastify'

import db from '../db'
import { DbCardModel } from '../db/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/match', {
    schema: {
      tags: ['card'],
      summary: 'Get one card',
      body: {
        type: 'object',
        required: ['item', 'type'],
        properties: {
          item: { type: 'string' },
          type: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const u = db.user
    if (u) {
      const { item, type } = req.body

      const r = await DbCardModel.findOne({
        userId: u._id,
        item,
        type
      })

      return r ? r.toJSON() : null
    }

    return reply.status(400).send()
  })

  f.post('/q', {
    schema: {
      tags: ['card'],
      summary: 'Query for cards',
      body: {
        type: 'object',
        required: ['cond'],
        properties: {
          cond: { type: 'object' },
          projection: {
            type: 'object',
            additionalProperties: { type: 'number' }
          },
          sort: {
            type: 'object',
            additionalProperties: { type: 'number' }
          },
          offset: { type: 'integer' },
          limit: { type: ['integer', 'null'] },
          join: { type: 'array', items: { type: 'string' } },
          hasCount: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'array', items: {} },
            offset: { type: 'integer' },
            limit: { type: ['integer', 'null'] },
            count: { type: 'integer' }
          }
        }
      }
    }
  }, async (req, reply) => {
    const u = db.user
    if (u) {
      const {
        cond,
        projection,
        sort = { updatedAt: -1 },
        offset = 0,
        limit = 10,
        join = [] as string[],
        hasCount = true
      } = req.body

      const match = [
        { $match: { userId: u._id } },
        ...(join.includes('quiz') ? [
          {
            $lookup: {
              from: 'quiz',
              localField: '_id',
              foreignField: 'cardId',
              as: 'q'
            }
          },
          { $unwind: { path: '$q', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              srsLevel: '$q.srsLevel',
              nextReview: '$q.nextReview',
              stat: '$q.stat'
            }
          }
        ] : []),
        { $match: cond }
      ]

      const [rData, rCount = []] = await Promise.all([
        DbCardModel.aggregate([
          ...match,
          { $sort: sort },
          { $skip: offset },
          ...(limit ? [
            { $limit: limit }
          ] : []),
          ...(projection ? [
            { $project: projection }
          ] : [])
        ]),
        hasCount ? DbCardModel.aggregate([
          ...match,
          { $count: 'count' }
        ]) : undefined
      ])

      return {
        result: rData,
        offset,
        limit,
        count: hasCount ? ((rCount[0] || {}).count || 0) : undefined
      }
    }

    return reply.status(400).send()
  })

  f.put('/', {
    schema: {
      tags: ['card'],
      summary: 'Create a card',
      body: {
        type: 'object',
        required: ['item', 'type'],
        properties: {
          item: { type: 'string' },
          type: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const u = db.user
    if (u) {
      const { item, type } = req.body

      const r = await DbCardModel.create({
        userId: u._id,
        item,
        type
      })

      return r.toJSON()
    }

    return reply.status(400).send()
  })

  f.patch('/', {
    schema: {
      tags: ['card'],
      summary: 'Create a card',
      body: {
        type: 'object',
        required: ['id', 'set'],
        properties: {
          id: { type: 'string' },
          set: { type: 'object' }
        }
      }
    }
  }, async (req, reply) => {
    const u = db.user
    if (u) {
      const { id, set } = req.body

      await DbCardModel.findByIdAndUpdate(id, {
        $set: set
      })

      return reply.status(201).send()
    }

    return reply.status(400).send()
  })

  f.delete('/', {
    schema: {
      tags: ['card'],
      summary: 'Delete a card',
      body: {
        type: 'object',
        required: ['item', 'type'],
        properties: {
          item: { type: 'string' },
          type: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const u = db.user
    if (u) {
      const { item, type } = req.body

      await DbCardModel.deleteOne({
        userId: u._id,
        item,
        type
      })

      return reply.status(201).send()
    }

    return reply.status(400).send()
  })

  next()
}

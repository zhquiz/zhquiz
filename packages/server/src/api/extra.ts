import { FastifyInstance } from 'fastify'
import { DbExtraModel } from '../db/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.patch('/warning', {
    schema: {
      tags: ['extra'],
      summary: 'Toggle avoid duplicate warning',
      body: {
        type: 'object',
        required: ['warn'],
        properties: {
          warn: { type: 'boolean' }
        }
      }
    }
  }, async (req, reply) => {
    const { warn } = req.body

    const u = req.session.user
    if (u) {
      u.userContentWarning = warn
      await u.save()
    }

    return reply.status(201).send()
  })

  f.post('/q', {
    schema: {
      tags: ['extra'],
      summary: 'Query for user-created items',
      body: {
        type: 'object',
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
    const u = req.session.user
    if (u) {
      const {
        cond = {},
        projection,
        sort = { updatedAt: -1 },
        offset = 0,
        limit = 10,
        hasCount = true
      } = req.body

      const match = [
        { $match: { userId: u._id } },
        { $match: cond }
      ]

      const [rData, rCount = []] = await Promise.all([
        DbExtraModel.aggregate([
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
        hasCount ? DbExtraModel.aggregate([
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

  f.post('/match', {
    schema: {
      tags: ['extra'],
      summary: 'Get data for a given user-created item',
      body: {
        type: 'object',
        required: ['entry'],
        properties: {
          entry: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'object',
              properties: {
                chinese: { type: 'string' },
                pinyin: { type: 'string' },
                english: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body
    const r = await DbExtraModel.findOne({ chinese: entry })

    return {
      result: r ? r.toJSON() : {}
    }
  })

  f.put('/', {
    schema: {
      tags: ['extra'],
      summary: 'Create a user-created item',
      body: {
        type: 'object',
        required: ['chinese', 'english'],
        properties: {
          chinese: { type: 'string' },
          pinyin: { type: 'string' },
          english: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const u = req.session.user
    if (u) {
      const { chinese, pinyin, english } = req.body
      const r = await DbExtraModel.create({
        userId: u._id,
        chinese,
        pinyin,
        english
      })

      return r.toJSON()
    }

    return reply.status(400).send()
  })

  f.patch('/', {
    schema: {
      tags: ['extra'],
      summary: 'Update user-created items',
      body: {
        type: 'object',
        required: ['ids', 'set'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          set: { type: 'object' }
        }
      }
    }
  }, async (req, reply) => {
    const { ids, set } = req.body

    await DbExtraModel.updateMany({ _id: { $in: ids } }, {
      $set: set
    })

    return reply.status(201).send()
  })

  f.delete('/', {
    schema: {
      tags: ['extra'],
      summary: 'Delete user-created items',
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (req, reply) => {
    const { ids } = req.body

    await Promise.all((await DbExtraModel.find({ _id: { $in: ids } })).map((el) => {
      return el.remove()
    }))

    return reply.status(201).send()
  })

  next()
}

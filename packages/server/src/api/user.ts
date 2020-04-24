import { FastifyInstance } from 'fastify'

import db from '../db'
import { DbUserModel } from '../db/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.get('/', {
    schema: {
      tags: ['user'],
      summary: 'Get user config'
    }
  }, async (_, reply) => {
    const u = db.user
    if (u) {
      return u.toJSON()
    }

    return reply.status(400).send()
  })

  f.patch('/', {
    schema: {
      tags: ['user'],
      summary: 'Update user config',
      body: {
        type: 'object',
        required: ['set'],
        properties: {
          set: { type: 'object' }
        }
      }
    }
  }, async (req, reply) => {
    const u = db.user
    if (u) {
      await DbUserModel.findByIdAndUpdate(u._id, {
        $set: req.body.set
      })

      return reply.status(201).send()
    }

    return reply.status(400).send()
  })

  next()
}

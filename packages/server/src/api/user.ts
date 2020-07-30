import { FastifyInstance } from 'fastify'

import { DbUserModel } from '@/db/mongo'
import { checkAuthorize } from '@/util/api'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.get('/', async (req, reply) => {
    const u = req.session.get('user')
    if (!u) {
      reply.status(401)
      return null
    }

    return u
  })

  f.patch(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['set'],
          properties: {
            set: { type: 'object' },
          },
        },
      },
    },
    async (req, reply) => {
      const userId = checkAuthorize(req, reply)
      if (userId) {
        return null
      }

      const { set } = req.body as {
        set: any
      }

      await DbUserModel.findByIdAndUpdate(userId, {
        $set: set,
      })
      reply.status(201)
      return null
    }
  )

  f.delete('/', async (req, reply) => {
    const userId = checkAuthorize(req, reply)
    if (!userId) {
      return null
    }

    await DbUserModel.purgeOne(userId)
    reply.status(201)
    return null
  })

  next()
}

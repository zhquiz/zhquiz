import { FastifyInstance } from 'fastify'

import { UserModel } from '../db/mongo'

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
            set: { type: 'object' }
          }
        }
      }
    },
    async (req, reply): Promise<{ result: string } | { error: string }> => {
      const userId: string = req.session.get('userId')
      if (!userId) {
        reply.status(401)
        return {
          error: 'not authorized'
        }
      }

      const { set } = req.body as {
        set: any
      }

      await UserModel.findByIdAndUpdate(userId, {
        $set: set
      })
      reply.status(201)
      return {
        result: 'updated'
      }
    }
  )

  f.delete(
    '/',
    async (req, reply): Promise<{ result: string } | { error: string }> => {
      const userId: string = req.session.get('userId')
      if (!userId) {
        reply.status(401)
        return {
          error: 'not authorized'
        }
      }

      await UserModel.findByIdAndRemove(userId)
      req.session.delete()
      reply.status(201)
      return {
        result: 'deleted'
      }
    }
  )

  f.delete(
    '/signOut',
    async (req, reply): Promise<{ result: string }> => {
      req.session.delete()
      reply.status(201)
      return {
        result: 'signed out'
      }
    }
  )

  next()
}

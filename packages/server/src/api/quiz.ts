import { FastifyInstance } from 'fastify'

import { DbCardModel, DbQuizModel } from '../db/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.get(
    '/card',
    {
      schema: {
        tags: ['quiz'],
        summary: 'Get card info for quiz',
        querystring: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
              mnemonic: { type: 'string' },
            },
          },
        },
      },
    },
    async (req) => {
      const { id } = req.query
      const r = await DbCardModel.findById(id).select({
        front: 1,
        back: 1,
        mnemonic: 1,
      })

      return r ? r.toJSON() : {}
    }
  )

  f.patch(
    '/right',
    {
      schema: {
        tags: ['quiz'],
        summary: 'Mark card as right',
        querystring: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.query

      let quiz = await DbQuizModel.findOne({ cardId: id })
      if (!quiz) {
        quiz = await DbQuizModel.create({ cardId: id } as any)
      }

      quiz.markRight()
      await quiz.save()

      return reply.status(201).send()
    }
  )

  f.patch(
    '/wrong',
    {
      schema: {
        tags: ['quiz'],
        summary: 'Mark card as wrong',
        querystring: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.query

      let quiz = await DbQuizModel.findOne({ cardId: id })
      if (!quiz) {
        quiz = await DbQuizModel.create({ cardId: id } as any)
      }

      quiz.markWrong()
      await quiz.save()

      return reply.status(201).send()
    }
  )

  f.patch(
    '/repeat',
    {
      schema: {
        tags: ['quiz'],
        summary: 'Mark card as repeat',
        querystring: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.query

      let quiz = await DbQuizModel.findOne({ cardId: id })
      if (!quiz) {
        quiz = await DbQuizModel.create({ cardId: id } as any)
      }

      quiz.markRepeat()
      await quiz.save()

      return reply.status(201).send()
    }
  )

  next()
}

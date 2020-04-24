import { FastifyInstance } from 'fastify'
import { DbQuizModel } from '../db/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.patch('/right', {
    schema: {
      tags: ['quiz'],
      summary: 'Mark card as right',
      querystring: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.query

    let quiz = await DbQuizModel.findOne({ cardId: id })
    if (!quiz) {
      quiz = await DbQuizModel.create({ cardId: id })
    }

    quiz.markRight()
    await quiz.save()

    return reply.status(201).send()
  })

  f.patch('/wrong', {
    schema: {
      tags: ['quiz'],
      summary: 'Mark card as wrong',
      querystring: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.query

    let quiz = await DbQuizModel.findOne({ cardId: id })
    if (!quiz) {
      quiz = await DbQuizModel.create({ cardId: id })
    }

    quiz.markWrong()
    await quiz.save()

    return reply.status(201).send()
  })

  f.patch('/repeat', {
    schema: {
      tags: ['quiz'],
      summary: 'Mark card as repeat',
      querystring: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.query

    let quiz = await DbQuizModel.findOne({ cardId: id })
    if (!quiz) {
      quiz = await DbQuizModel.create({ cardId: id })
    }

    quiz.markRepeat()
    await quiz.save()

    return reply.status(201).send()
  })

  next()
}

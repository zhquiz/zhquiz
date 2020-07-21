import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { DbCardModel, DbQuizModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const tags = ['quiz']

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
        quiz = await DbQuizModel.create({ cardId: id })
      }

      quiz.markRight()
      await quiz.save()

      reply.status(201).send()
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
        quiz = await DbQuizModel.create({ cardId: id })
      }

      quiz.markWrong()
      await quiz.save()

      reply.status(201).send()
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
        quiz = await DbQuizModel.create({ cardId: id })
      }

      quiz.markRepeat()
      await quiz.save()

      reply.status(201).send()
    }
  )

  postEntries()

  next()

  function postEntries() {
    const sBody = S.shape({
      entries: S.list(S.string()),
      type: S.string().enum('vocab'),
      select: S.list(S.string().enum('cardId', 'entry', 'srsLevel')),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          entry: S.string().optional(),
          srsLevel: S.integer().optional(),
          cardId: S.string().optional(),
        })
      ),
    })

    f.post<any, any, any, typeof sBody.type>(
      '/entries',
      {
        schema: {
          tags,
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply) => {
        const u = req.session.user
        if (!u || !u._id) {
          reply.status(401).send()
          return
        }

        const { entries, type, select } = req.body

        const r = await DbCardModel.aggregate([
          {
            $match: {
              userId: u._id,
              item: {
                $in: entries,
              },
              type,
            },
          },
          {
            $lookup: {
              from: 'quiz',
              localField: '_id',
              foreignField: 'cardId',
              as: 'q',
            },
          },
          {
            $project: Object.assign(
              { _id: 0 },
              select.reduce(
                (prev, k) => ({
                  ...prev,
                  [k]: {
                    cardId: '$_id',
                    entry: '$item',
                    srsLevel: { $ifNull: [{ $max: '$q.srsLevel' }, -1] },
                  }[k],
                }),
                {} as any
              )
            ),
          },
        ])

        return {
          result: r,
        }
      }
    )
  }
}

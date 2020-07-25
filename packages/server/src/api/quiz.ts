import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { DbCardModel, DbQuizModel } from '../db/mongo'
import { checkAuthorize } from '../util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getCard()
  doMark('right')
  doMark('wrong')
  doMark('repeat')
  postEntries()

  next()

  function getCard() {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResponse = S.shape({
      front: S.string().optional(),
      back: S.string().optional(),
      mnemonic: S.string().optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/card',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return {}
        }

        const { id } = req.query
        const r = await DbCardModel.findOne({
          _id: id,
          userId,
        }).select({
          front: 1,
          back: 1,
          mnemonic: 1,
        })

        return r ? r.toJSON() : {}
      }
    )
  }

  function doMark(mark: 'right' | 'wrong' | 'repeat') {
    const sQuery = S.shape({
      id: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
    }>(
      `/${mark}`,
      {
        schema: {
          querystring: sQuery.valueOf(),
        },
      },
      async (req, reply) => {
        const { id } = req.query

        let quiz = await DbQuizModel.findOne({ cardId: id })
        if (!quiz) {
          quiz = await DbQuizModel.create({ cardId: id })
        }

        if (mark === 'right') {
          quiz.markRight()
        } else if (mark === 'wrong') {
          quiz.markWrong()
        } else {
          quiz.markRepeat()
        }

        await quiz.save()

        reply.status(201)
        return null
      }
    )
  }

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

    f.post<{
      Body: typeof sBody.type
    }>(
      '/entries',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply) => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return null
        }

        const { entries, type, select } = req.body

        const r = await DbCardModel.aggregate([
          {
            $match: {
              userId,
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

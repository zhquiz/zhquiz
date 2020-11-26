import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zh } from '../db/chinese'
import { QuizModel, UserModel, sQuizDirection, sQuizType } from '../db/mongo'
import { shuffle } from './util'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getById()
  postGetByIds()
  getByEntry()
  postGetByEntries()
  doMark()
  getTagAll()
  postInit()
  doCreateByEntry()
  doUpdateSet()
  doDelete()
  postDeleteByIds()

  next()

  function getById() {
    const sQuery = S.shape({
      id: S.string(),
      select: S.list(S.string()).minItems(1)
    })

    const sResponse = S.object().additionalProperties(true)

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { id, select } = req.query
        const r = await QuizModel.findOne({
          _id: id,
          userId
        }).select(select.join(' '))

        if (!r) {
          reply.status(404)
          return {
            error: 'not found'
          }
        }

        const { userId: _, ...out } = r

        return out
      }
    )
  }

  function postGetByIds() {
    const sBody = S.shape({
      ids: S.list(S.string()),
      select: S.list(S.string())
    })

    const sResponse = S.shape({
      result: S.list(S.object().additionalProperties(true))
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/ids',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { ids, select } = req.body
        const result = await QuizModel.find({
          _id: { $in: ids },
          userId
        })
          .select(select.join(' '))
          .then((rs) => rs.map(({ userId, ...r }) => r))

        return { result }
      }
    )
  }

  function getByEntry() {
    const sQuery = S.shape({
      entry: S.string(),
      select: S.list(S.string()).minItems(1),
      type: sQuizType
    })

    const sResponse = S.shape({
      result: S.list(S.object().additionalProperties(true))
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/entry',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { entry, select, type } = req.query

        const result = await QuizModel.find({
          entry,
          type,
          userId
        })
          .select(select.join(' '))
          .then((rs) => rs.map(({ userId, ...r }) => r))

        return {
          result
        }
      }
    )
  }

  function postGetByEntries() {
    const sBody = S.shape({
      entries: S.list(S.string()).minItems(1),
      select: S.list(S.string()),
      type: sQuizType
    })

    const sResponse = S.shape({
      result: S.list(S.object().additionalProperties(true))
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/entries',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { entries, select, type } = req.body

        const result = await QuizModel.find({
          entry: { $in: entries },
          type,
          userId
        })
          .select(select.join(' '))
          .then((rs) => rs.map(({ userId, ...r }) => r))

        return {
          result
        }
      }
    )
  }

  function doMark() {
    const sQuery = S.shape({
      id: S.string(),
      type: S.string().enum('right', 'wrong', 'repeat')
    })

    f.patch<{
      Querystring: typeof sQuery.type
    }>(
      '/mark',
      {
        schema: {
          querystring: sQuery.valueOf()
        }
      },
      async (
        req,
        reply
      ): Promise<{ result: string } | { error: string; target?: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { id, type } = req.query

        const quiz = await QuizModel.findOne({
          userId,
          _id: id
        })

        if (!quiz) {
          reply.status(404)
          return {
            error: 'not found',
            target: 'Quiz'
          }
        }

        if (type === 'right') {
          quiz.markRight()
        } else if (type === 'wrong') {
          quiz.markWrong()
        } else {
          quiz.markRepeat()
        }

        await quiz.save()

        reply.status(201)

        return {
          result: 'updated'
        }
      }
    )
  }

  function getTagAll() {
    const sResponse = S.shape({
      tags: S.list(S.string())
    })

    f.get(
      '/tag/all',
      {
        schema: {
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<
        | {
            tags: []
          }
        | { error: string }
      > => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const r = await QuizModel.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              tags: { $addToSet: '$tag' }
            }
          }
        ])

        return {
          tags: ((r[0] || {}).tags || []).sort()
        }
      }
    )
  }

  function postInit() {
    const myStage = S.string().enum('new', 'leech', 'learning', 'graduated')

    const sBody = S.shape({
      type: S.list(sQuizType),
      stage: S.list(myStage),
      direction: S.list(sQuizDirection),
      isDue: S.boolean().optional(),
      tag: S.list(S.string()).optional()
    })

    const sQuizItem = S.shape({
      _id: S.string(),
      srsLevel: S.integer().optional(),
      nextReview: S.string().format('date-time').optional()
    })

    const sResponse = S.shape({
      quiz: S.list(sQuizItem),
      upcoming: S.list(S.string().format('date-time')).optional()
    })

    f.get<{
      Body: typeof sBody.type
    }>(
      '/init',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { type, stage, direction, isDue = true, tag } = req.body

        /**
         * No need to await
         */
        UserModel.findByIdAndUpdate(userId, {
          $set: {
            'settings.quiz.type': type,
            'settings.quiz.stage': stage,
            'settings.quiz.direction': direction,
            'settings.quiz.isDue': isDue
          }
        })

        const $or: any[] = []

        if (stage.includes('new')) {
          $or.push({
            srsLevel: { $exists: false }
          })
        }

        if (stage.includes('leech')) {
          $or.push({
            'stat.streak.wrong': { $gte: 3 }
          })
        }

        if (stage.includes('learning')) {
          $or.push({
            srsLevel: { $lt: 3 }
          })
        }

        if (stage.includes('graduated')) {
          $or.push({
            srsLevel: { $gte: 3 }
          })
        }

        const rs = await QuizModel.find({
          $and: [
            {
              userId,
              type: { $in: type },
              direction: { $in: direction },
              ...(tag ? { tag: { $in: tag } } : {})
            },
            ...($or.length ? [{ $or }] : [])
          ]
        }).select('_id nextReview srsLevel stat')

        if (isDue) {
          const now = new Date()
          const quiz: typeof sQuizItem.type[] = []
          const upcoming: string[] = []

          rs.map(({ nextReview, srsLevel, _id }) => {
            if (!nextReview || nextReview < now) {
              quiz.push({
                nextReview: nextReview ? nextReview.toISOString() : undefined,
                srsLevel,
                _id
              })
            } else {
              upcoming.push(nextReview.toISOString())
            }
          })

          return {
            quiz: shuffle(quiz),
            upcoming: upcoming.sort()
          }
        } else {
          return {
            quiz: shuffle(rs.map(({ _id }) => ({ _id })))
          }
        }
      }
    )
  }

  function doCreateByEntry() {
    const sBody = S.shape({
      entry: S.anyOf(S.string(), S.list(S.string())),
      type: sQuizType,
      direction: S.list(sQuizDirection).minItems(1).optional()
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: sBody.valueOf()
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

        const {
          entry,
          type,
          direction = type === 'vocab' ? ['se', 'te', 'ec'] : ['se', 'ec']
        } = req.body
        const entries = Array.isArray(entry) ? entry : [entry]

        if (type === 'vocab' && direction.includes('te')) {
          const isTrad = zh.db
            .prepare(
              /* sql */ `
          SELECT ROWID FROM cedict
          WHERE (simplified = @entry OR traditional = @entry) AND traditional IS NOT NULL
          `
            )
            .get()

          if (!isTrad) {
            const i = direction.indexOf('te')
            if (i !== -1) {
              direction.splice(i, 1)
            }
          }
        }

        try {
          await QuizModel.insertMany(
            entries.flatMap((entry) => {
              return direction.map((dir) => ({
                userId,
                entry,
                type,
                direction: dir
              }))
            }),
            { ordered: false }
          )
        } catch (e) {
          if (e.nInserted === 0) {
            reply.status(304)
            return {
              error: 'No quiz items created'
            }
          }

          const writeCount = new Map<string, number>()

          ;(e.writeErrors || []).map(({ op: { entry } }: any) => {
            writeCount.set(entry, (writeCount.get(entry) || 0) + 1)
          })

          const failedEntries = Array.from(writeCount)
            .filter(([, count]) => count >= 2)
            .map(([k]) => k)

          if (failedEntries.length) {
            reply.status(304)
            return {
              error: `The following quiz items failed to create: ${failedEntries.join(
                ','
              )}`
            }
          }
        }

        reply.status(201)
        return {
          result: 'updated'
        }
      }
    )
  }

  function doUpdateSet() {
    const sQuery = S.shape({
      id: S.string()
    })

    const sBody = S.shape({
      set: S.shape({
        front: S.string().optional(),
        back: S.string().optional(),
        mnemonic: S.string().optional(),
        tag: S.list(S.string()).optional()
      })
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
          body: sBody.valueOf()
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

        const { id } = req.query
        const { set } = req.body

        const $set: any = {}
        const $unset: any = {}

        Object.entries(set).map(([k, v]) => {
          if (v === '') {
            $unset[k] = ''
          } else if (Array.isArray(v) && v.length === 0) {
            $unset[k] = ''
          } else {
            $set[k] = v
          }
        })

        await QuizModel.findOneAndUpdate(
          {
            userId,
            _id: id
          },
          {
            $set,
            $unset
          }
        )

        reply.status(201)
        return {
          result: 'updated'
        }
      }
    )
  }

  function doDelete() {
    const sQuery = S.shape({
      id: S.string()
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf()
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

        const { id } = req.query
        await QuizModel.deleteOne({
          _id: id,
          userId
        })

        reply.status(201)
        return {
          result: 'deleted'
        }
      }
    )
  }

  function postDeleteByIds() {
    const sBody = S.shape({
      ids: S.list(S.string()).minItems(1)
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/delete/ids',
      {
        schema: {
          body: sBody.valueOf()
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

        const { ids } = req.body
        await QuizModel.deleteMany({
          _id: { $in: ids },
          userId
        })

        reply.status(201)
        return {
          result: 'deleted'
        }
      }
    )
  }
}

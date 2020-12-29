import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'
import XRegExp from 'xregexp'

import { zh } from '../db/chinese'
import { ExtraModel, sQuizType } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getQ()
  getMatch()
  doCreate()
  doUpdate()
  doDelete()

  next()

  function getQ() {
    const sQuery = S.shape({
      select: S.list(S.string()).minItems(1),
      sortBy: S.string().optional(),
      desc: S.boolean().optional(),
      page: S.integer().minimum(1),
      perPage: S.integer().minimum(10).optional()
    })

    const sResponse = S.shape({
      result: S.list(S.object().additionalProperties(true)),
      count: S.integer().optional()
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
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

        const {
          select,
          sortBy: _sortBy,
          desc: _desc,
          page = 1,
          perPage = 10
        } = req.query
        const offset = (page - 1) * perPage

        const sortBy = _sortBy || 'updatedAt'
        const desc = _sortBy ? _desc || false : true

        const result = await ExtraModel.find({
          userId
        })
          .sort({ [sortBy]: desc ? -1 : 1 })
          .select(select.join(' '))
          .skip(offset)
          .limit(perPage)

        const count = await ExtraModel.countDocuments({ userId })

        return {
          result,
          count
        }
      }
    )
  }

  function getMatch() {
    const sQuery = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      entry: S.string(),
      alt: S.list(S.string()).optional(),
      pinyin: S.string(),
      english: S.string()
    })

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

        const { entry } = req.query
        const r = await ExtraModel.findOne({
          userId,
          entry
        })

        if (!r) {
          reply.status(404)
          return {
            error: 'query not found'
          }
        }

        return {
          entry: r.entry,
          alt: r.alt,
          pinyin: r.pinyin,
          english: r.english
        }
      }
    )
  }

  function doCreate() {
    const sBody = S.shape({
      entry: S.string(),
      alt: S.list(S.string()).minItems(1).optional(),
      pinyin: S.string().optional(),
      english: S.string(),
      type: sQuizType.optional()
    })

    const sResponse = S.shape({
      id: S.string()
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
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
      ): Promise<
        typeof sResponse.type | { error: string; target?: string }
      > => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            error: 'not authorized'
          }
        }

        const { entry, alt, pinyin, english, type = 'vocab' } = req.body

        const isCustom = zh.custom
          .prepare(
            /* sql */ `
        SELECT ROWID
        FROM custom c
        LEFT JOIN custom_alt alt
        WHERE c.entry = @entry OR alt.entry = @entry
        `
          )
          .get({ entry })

        if (isCustom) {
          reply.status(304)
          return {
            error: 'existed',
            target: 'custom'
          }
        }

        if (type === 'sentence') {
          const isSentence = zh.db
            .prepare(
              /* sql */ `
          SELECT ROWID
          FROM sentence s
          JOIN sentence_token st
          WHERE st.entry = @entry
          `
            )
            .get({ entry })

          if (isSentence) {
            reply.status(304)
            return {
              error: 'existed',
              target: 'sentence'
            }
          }
        } else if (type === 'hanzi' || XRegExp('^\\p{Han}$').test(entry)) {
          const isHanzi = zh.db
            .prepare(
              /* sql */ `
          SELECT ROWID FROM token WHERE [entry] = @entry AND english IS NOT NULL
          `
            )
            .get({ entry })

          if (isHanzi) {
            reply.status(304)
            return {
              error: 'existed',
              target: 'token'
            }
          }
        } else {
          const isCedict = zh.db
            .prepare(
              /* sql */ `
          SELECT ROWID FROM cedict WHERE simplified = @entry OR traditional = @entry
          `
            )
            .get({ entry })

          if (isCedict) {
            reply.status(304)
            return {
              error: 'existed',
              target: 'cedict'
            }
          }
        }

        const extra = await ExtraModel.create({
          userId,
          entry,
          alt,
          pinyin: pinyin || makePinyin(entry, { keepRest: true }),
          english,
          type
        })

        reply.status(201)
        return {
          id: extra._id
        }
      }
    )
  }

  function doUpdate() {
    const sBody = S.shape({
      ids: S.list(S.string()).minItems(1),
      set: S.shape({
        entry: S.string().optional(),
        alt: S.list(S.string()).minItems(1).optional(),
        pinyin: S.string().optional(),
        english: S.string().optional()
      })
    })

    f.patch<{
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

        const { ids, set } = req.body

        await ExtraModel.updateMany(
          { userId, _id: { $in: ids } },
          {
            $set: set
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

        await ExtraModel.findOneAndRemove({ userId, _id: id })

        reply.status(201)
        return {
          result: 'deleted'
        }
      }
    )
  }
}

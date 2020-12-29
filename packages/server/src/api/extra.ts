import makePinyin from 'chinese-to-pinyin'
import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zhSentence, zhToken, zhVocab } from '@/db/local'
import { DbExtraModel, sDbExtraExport } from '@/db/mongo'
import { checkAuthorize } from '@/util/api'
import { sId, sQuizType, sSort, sStringNonEmpty } from '@/util/schema'

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
      sort: S.list(sSort(['chinese', 'pinyin', 'english', 'updatedAt']))
        .minItems(1)
        .optional(),
      page: S.integer().minimum(1),
      perPage: S.integer().minimum(10).optional(),
    })

    const sResponse = S.shape({
      result: S.list(sDbExtraExport),
      count: S.integer().optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
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
          return undefined as any
        }

        const {
          select,
          sort = ['-updatedAt'],
          page = 1,
          perPage = 10,
        } = req.query
        const offset = (page - 1) * perPage

        const result = await DbExtraModel.find({
          userId,
        })
          .sort(sort.join(' '))
          .select(select.join(' '))
          .skip(offset)
          .limit(perPage)

        const count = await DbExtraModel.countDocuments({ userId })

        return {
          result,
          count,
        }
      }
    )
  }

  function getMatch() {
    const sQuery = S.shape({
      entry: sStringNonEmpty,
      select: S.list(S.string()).minItems(1).optional(),
    })

    const sResponse = sDbExtraExport

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
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
          return undefined as any
        }

        const { entry, select = ['chinese', 'pinyin', 'english'] } = req.query
        const r = await DbExtraModel.findOne({
          userId,
          entry,
        }).select(select.join(' '))

        return r || {}
      }
    )
  }

  function doCreate() {
    const sBody = S.shape({
      chinese: S.string(),
      pinyin: S.string().optional(),
      english: S.string(),
    })

    const sResponse = S.shape({
      existing: S.shape({
        type: sQuizType,
        entry: S.string(),
      }).optional(),
      _id: sId.optional(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return undefined as any
        }

        const { chinese, pinyin, english } = req.body

        {
          const existing = zhVocab.findOne({
            $or: [{ simplified: chinese }, { traditional: { $in: chinese } }],
          })
          if (existing) {
            return {
              existing: {
                type: 'vocab',
                entry: existing.simplified,
              },
            }
          }
        }

        if (chinese.length === 1) {
          const existing = zhToken.findOne({
            entry: chinese,
            english: { $ne: undefined },
          })
          if (existing) {
            return {
              existing: {
                type: 'hanzi',
                entry: chinese,
              },
            }
          }
        } else {
          const existing = zhSentence.findOne({
            chinese,
          })
          if (existing) {
            return {
              existing: {
                type: 'sentence',
                entry: chinese,
              },
            }
          }
        }

        const extra = await DbExtraModel.create({
          userId,
          chinese,
          pinyin: pinyin || makePinyin(chinese, { keepRest: true }),
          english,
        })

        return {
          _id: extra._id,
        }
      }
    )
  }

  function doUpdate() {
    const sBody = S.shape({
      id: S.anyOf(sId, S.list(sId).minItems(1)),
      set: sDbExtraExport,
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: {
            type: 'object',
            required: ['ids', 'set'],
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
              set: { type: 'object' },
            },
          },
        },
      },
      async (req, reply): Promise<void> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return
        }

        const { id, set } = req.body

        await DbExtraModel.updateMany(
          { _id: { $in: Array.isArray(id) ? id : [id] } },
          {
            $set: set,
          }
        )

        reply.status(201).send()
      }
    )
  }

  function doDelete() {
    const sQuery = S.shape({
      id: sId,
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
        },
      },
      async (req, reply): Promise<void> => {
        const userId = checkAuthorize(req, reply)
        if (!userId) {
          return
        }

        const { id } = req.query

        await DbExtraModel.purgeMany(userId, {
          _id: id,
        })

        reply.status(201).send()
      }
    )
  }
}

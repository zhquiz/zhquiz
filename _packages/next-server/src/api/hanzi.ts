import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zh } from '../db/chinese'
import { QuizModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  getMatch()
  getRandom()

  next()

  function getMatch() {
    const sQuery = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      sup: S.string().optional(),
      sub: S.string().optional(),
      variants: S.string().optional(),
      pinyin: S.string().optional(),
      english: S.string().optional()
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/match',
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
        const { entry } = req.query
        const result = zh.db
          .prepare(
            /* sql */ `
        SELECT
          pinyin, english,
          (
            SELECT group_concat(child, '') FROM token_sub WHERE parent = [entry] GROUP BY parent
          )   sub,
          (
            SELECT group_concat(child, '') FROM token_sup WHERE parent = [entry] GROUP BY parent
          )   sup,
          (
            SELECT group_concat(child, '') FROM token_var WHERE parent = [entry] GROUP BY parent
          )   variants
        FROM token
        WHERE [entry] = @entry
        `
          )
          .get({ entry })

        if (!result) {
          reply.status(404)
          return {
            error: 'not found'
          }
        }

        const { sub, sup, variants, pinyin, english } = result

        if ([sub, sup, variants, pinyin, english].every((el) => !el)) {
          reply.status(404)
          return {
            error: 'not found'
          }
        }

        return {
          sub: sub || undefined,
          sup: sup || undefined,
          variants: variants || undefined,
          pinyin: pinyin || undefined,
          english: english || undefined
        }
      }
    )
  }

  function getRandom() {
    const sQuery = S.shape({
      level: S.integer().optional(),
      new: S.enum(0, 1).optional()
    })

    const sResponse = S.shape({
      result: S.string().optional(),
      english: S.string().optional(),
      level: S.integer().optional()
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/random',
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

        const { level = 60 } = req.query
        const isNew = req.query.new !== 0

        let allH = zh.db
          .prepare(
            /* sql */ `
        SELECT [entry]
        FROM token
        WHERE hanzi_level <= @level AND hanzi_level IS NOT NULL
        `
          )
          .all({ level })
          .map((it) => it.entry as string)

        if (isNew) {
          const reviewing = await QuizModel.find({
            userId,
            entry: { $in: allH },
            type: 'hanzi',
            nextReview: { $exists: true }
          }).select('entry')

          if (reviewing.length) {
            const allHSet = new Set(allH)
            for (const r of reviewing) {
              allHSet.delete(r.entry)
            }
            if (allHSet.size) {
              allH = Array.from(allHSet)
            } else {
              reply.status(404)
              return {
                error: 'no more targets left',
                target: 'Quiz'
              }
            }
          }
        }

        const h = allH[Math.floor(Math.random() * allH.length)]
        if (!h) {
          reply.status(404)
          return {
            error: 'nothing to random',
            target: 'token'
          }
        }

        const current = zh.db
          .prepare(
            /* sql */ `
        SELECT english, hanzi_level [level]
        FROM token
        WHERE [entry] = @h
        `
          )
          .get(h)

        return {
          result: h,
          english: current?.english,
          level: current?.level
        }
      }
    )
  }
}

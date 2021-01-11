import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { g } from '../shared'

const extraRouter = (f: FastifyInstance, _: unknown, next: () => void) => {
  const selMap: Record<string, string> = {
    id: 'extra.id id',
    chinese: 'extra.chinese chinese',
    pinyin: 'extra_q.pinyin pinyin',
    english: 'extra_q.english english',
    type: 'extra.type [type]',
    description: 'extra_q.description description',
    tag: 'extra_q.tag tag'
  }

  {
    const sQuerystring = S.shape({
      q: S.string().optional(),
      select: S.string(),
      sort: S.string().optional(),
      page: S.integer().minimum(1),
      perPage: S.integer().minimum(5)
    })

    const sResponse = S.shape({
      result: S.list(S.object()),
      count: S.integer().minimum(0)
    })

    f.get<{
      Querystring: typeof sQuerystring.type
    }>(
      '/q',
      {
        schema: {
          querystring: sQuerystring.valueOf(),
          response: {
            200: sResponse.valueOf()
          }
        }
      },
      async (
        req,
        reply
      ): Promise<typeof sResponse.type | { error: string }> => {
        const { q, select, sort = '-updatedAt', page, perPage } = req.query

        let sorter = sort
        let sortDirection = ''

        if (sort[0] === '-') {
          sorter = sorter.substr(1)
          sortDirection = ' DESC'
        }

        sorter =
          (({
            updatedAt: 'extra.updatedAt'
          } as Record<string, string>)[sorter] || 'extra.updatedAt') +
          sortDirection

        const sel = select
          .split(/,/g)
          .map((s) => selMap[s.trim()])
          .filter((s) => s)

        if (!sel.length) {
          reply.status(400)
          return {
            error: 'not enough select'
          }
        }

        const params = {
          map: new Map<number, any>(),
          set(v: any) {
            const i = this.map.size + 1
            this.map.set(i, v)
            return `$${i}`
          },
          get() {
            return Object.fromEntries(this.map)
          }
        }
        const where: string[] = []

        if (q) {
          where.push(/* sql */ `
          extra.id IN (
            SELECT id FROM extra_q WHERE extra_q MATCH ${params.set(q)}
          )
          `)
        }

        try {
          const { count = 0 } =
            g.server.db
              .prepare(
                /* sql */ `
        SELECT COUNT(*) [count]
        FROM extra
        WHERE ${where.join(' AND ') || 'TRUE'}
        `
              )
              .get(params.get()) || {}

          const result = g.server.db
            .prepare(
              /* sql */ `
        SELECT ${sel}
        FROM extra
        LEFT JOIN extra_q ON extra_q.id = extra.id
        WHERE ${where.join(' AND ') || 'TRUE'}
        ORDER BY ${sorter}
        LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
        GROUP BY extra.id
        `
            )
            .all(params.get())

          return {
            result,
            count
          }
        } catch (e) {
          g.server.logger.error(e)

          return {
            result: [],
            count: 0
          }
        }
      }
    )
  }

  {
    const sQuerystring = S.shape({
      entry: S.string(),
      select: S.string()
    })

    f.get<{
      Querystring: typeof sQuerystring.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuerystring.valueOf()
        }
      },
      async (req, reply) => {
        const { entry, select } = req.query

        const sel = select
          .split(/,/g)
          .map((s) => selMap[s.trim()])
          .filter((s) => s)

        if (!sel.length) {
          reply.status(400)
          return {
            error: 'not enough select'
          }
        }

        const result = g.server.db
          .prepare(
            /* sql */ `
        SELECT ${sel}
        FROM extra
        LEFT JOIN extra_q ON extra_q.id = extra.id
        WHERE extra.chinese = @entry
        LIMIT 1
        GROUP BY extra.id
        `
          )
          .get({ entry })

        if (!result) {
          reply.status(404)
          return {
            error: 'no entries found'
          }
        }

        return result
      }
    )
  }

  next()
}

export default extraRouter

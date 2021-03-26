import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { QSplit, makeQuiz, makeTag } from '../db/token'
import { db } from '../shared'

const characterRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      sub: S.list(S.string()),
      sup: S.list(S.string()),
      var: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/radical',
      {
        schema: {
          operationId: 'characterRadical',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const [rad] = await db.query(sql`
        SELECT "sub", "sup", "var" FROM dict.radical
        WHERE "entry" = ${entry}
        `)

        return {
          sub: rad?.sub || [],
          sup: rad?.sup || [],
          var: rad?.var || [],
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          alt: S.list(S.string()),
          reading: S.list(S.string()),
          english: S.list(S.string()),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/vocabulary',
      {
        schema: {
          operationId: 'characterVocabulary',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const fThreshold = 1

        let result = await db.query(sql`
        WITH match_cte AS (
          SELECT
            "entry"[1] "entry",
            "entry"[2:]||'{}'::text[] "alt",
            "pinyin" "reading",
            "english",
            "frequency"
          FROM vocabulary
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry}
          ORDER BY RANDOM()
        )

        SELECT *
        FROM (
          SELECT * FROM (
            SELECT * FROM match_cte
            WHERE "frequency" > ${fThreshold}
          ) t2
          UNION ALL
          SELECT * FROM (
            SELECT * FROM match_cte
            WHERE "frequency" < ${fThreshold}
          ) t2
          UNION ALL
          SELECT * FROM (
            SELECT * FROM match_cte
            WHERE "frequency" IS NULL
          ) t2
        ) t1
        LIMIT ${limit}
        `)

        if (result[0] && result[0].frequency) {
          result = result.filter((r) => r.frequency)
        }

        return {
          result,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          english: S.string(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/sentence',
      {
        schema: {
          operationId: 'characterSentence',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const result = await db.query(sql`
        WITH match_cte AS (
          SELECT "entry", "english"[1] "english", "isTrad"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry}
        )

        SELECT *
        FROM (
          SELECT * FROM (
            SELECT "entry", "english"
            FROM match_cte WHERE NOT "isTrad"
            ORDER BY RANDOM()
          ) t1
          UNION
          SELECT * FROM (
            SELECT "entry", "english"
            FROM match_cte WHERE "isTrad"
            ORDER BY RANDOM()
          ) t1
        ) t2
        LIMIT ${limit}
        `)

        return {
          result,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      entry: S.string(),
      reading: S.list(S.string()),
      english: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/entry',
      {
        schema: {
          operationId: 'characterGetByEntry',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await lookupCharacter(entry, userId)

        if (!r) {
          throw { statusCode: 404 }
        }

        return r
      }
    )
  }

  {
    const makeRad = new QSplit({
      default(v) {
        if (/^\p{sc=Han}{2,}$/u.test(v)) {
          const re = /\p{sc=Han}/gu
          let m = re.exec(v)
          const out: string[] = []
          while (m) {
            out.push(m[0])
            m = re.exec(v)
          }

          return sql`(${sql.join(
            out.map((v) => {
              return this.fields.entry[':'](v)
            }),
            ' OR '
          )})`
        } else if (/^\p{sc=Han}$/u.test(v)) {
          return sql`(${sql.join(
            [
              this.fields.entry[':'](v),
              this.fields.sub[':'](v),
              this.fields.sup[':'](v),
              this.fields.var[':'](v),
            ],
            ' OR '
          )})`
        }

        return null
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@~ character_expand(${v})` },
        hanzi: { ':': (v) => sql`"entry" &@~ character_expand(${v})` },
        sub: { ':': (v) => sql`"sub" &@ ${v}` },
        sup: { ':': (v) => sql`"sup" &@ ${v}` },
        var: { ':': (v) => sql`"var" &@ ${v}` },
      },
    })

    const makeZh = new QSplit({
      default(v) {
        if (/^\p{sc=Han}+$/u.test(v)) {
          return sql`TRUE`
        }

        return sql`(${sql.join(
          [this.fields.reading[':'](v), this.fields.english[':'](v)],
          ' OR '
        )})`
      },
      fields: {
        pinyin: { ':': (v) => sql`normalize_pinyin("pinyin") &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin("pinyin") &@ ${v}` },
        english: { ':': (v) => sql`"english" &@ ${v}` },
      },
    })

    const sQuery = S.shape({
      q: S.string(),
    })

    const sResult = S.shape({
      result: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'characterQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        let { q } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        q = q.trim()
        if (!q) {
          return { result: [] }
        }

        const qCond = makeQuiz.parse(q)
        const radCond = makeRad.parse(q)
        const hCond = makeZh.parse(q)
        const tagCond = makeTag.parse(q)

        if (!hCond && !radCond && !qCond && !tagCond) {
          return { result: [] }
        }

        const result = await db.query(sql`
        SELECT DISTINCT "entry"
        FROM "character"
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) ${hCond ? sql` AND ${hCond}` : sql``} ${
          radCond
            ? sql` AND "entry" IN (
          SELECT "entry" FROM dict.radical WHERE ${radCond}
        )`
            : sql``
        } ${
          tagCond
            ? sql` AND "entry" IN (
            SELECT "entry"
            FROM entry_tag
            WHERE (
              "userId" IS NULL OR "userId" = ${userId}
            ) AND "type" = 'character' AND ${tagCond}
          )`
            : sql``
        } ${
          qCond
            ? sql` AND "entry" IN (
          SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'vocabulary' AND ${qCond}
        )`
            : sql``
        }
        LIMIT 20
        `)

        return {
          result: result.map((r) => r.entry),
        }
      }
    )
  }

  {
    const sResult = S.shape({
      result: S.string(),
      english: S.string(),
      level: S.integer(),
    })

    f.get(
      '/random',
      {
        schema: {
          operationId: 'characterRandom',
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const [u] = await db.query(sql`
        SELECT "level.min", "level.max" FROM "user" WHERE "id" = ${userId}
        `)

        if (!u) {
          throw { statusCode: 401 }
        }

        u['level.min'] = u['level.min'] || 1
        u['level.max'] = u['level.max'] || 10

        const [r] = await db.query(sql`
        SELECT "entry" "result", "level", (
          SELECT "english"
          FROM "character" c
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND c."entry" = t1."entry"
        ) "english"
        FROM (
          SELECT "entry", "hLevel" "level"
          FROM dict.zhlevel
          WHERE "hLevel" >= ${u['level.min']} AND "hLevel" <= ${u['level.max']}
          ORDER BY RANDOM()
          LIMIT 1
        ) t1
        `)

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          result: r.result,
          english: (r.english || ['???']).join(' / '),
          level: r.level,
        }
      }
    )
  }

  {
    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          level: S.integer(),
        })
      ),
    })

    f.get(
      '/level',
      {
        schema: {
          operationId: 'characterListLevel',
          response: { 200: sResult.valueOf() },
        },
      },
      async (): Promise<typeof sResult.type> => {
        const result: {
          entry: string
          level: number
        }[] = await db.query(sql`
        SELECT "entry", "hLevel" "level"
        FROM dict.zhlevel
        WHERE "hLevel" IS NOT NULL
        `)

        return {
          result,
        }
      }
    )
  }
}

export default characterRouter

export async function lookupCharacter(
  entry: string,
  userId: string
): Promise<{
  entry: string
  reading: string[]
  english: string[]
} | null> {
  if (!/^\p{sc=Han}$/u.test(entry)) {
    throw { statusCode: 400, message: 'not Character' }
  }

  const [r] = await db.query(sql`
  SELECT "entry", "pinyin" "reading", "english"
  FROM "character"
  WHERE (
    "userId" IS NULL OR "userId" = ${userId}
  ) AND "entry" = ${entry}
  `)

  return r || null
}

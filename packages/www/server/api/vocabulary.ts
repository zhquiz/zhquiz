import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { QSplit, makeQuiz, makeTag } from '../db/token'
import { db } from '../shared'

const vocabularyRouter: FastifyPluginAsync = async (f) => {
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
          operationId: 'vocabularySentence',
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

        const result = await db.query(sql`
        SELECT "entry", "english"[1] "english"
        FROM sentence
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND to_tsvector('jiebaqry', "entry") @@ to_tsquery('jiebaqry', ${entry}) AND NOT "isTrad"
        ORDER BY RANDOM()
        LIMIT ${limit}
        `)

        if (result.length < limit) {
          result.push(
            ...(await db.query(sql`
          SELECT "entry", "english"[1] "english"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND to_tsvector('jiebaqry', "entry") @@ to_tsquery('jiebaqry', ${entry}) AND "isTrad"
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
        }

        if (result.length < limit) {
          result.push(
            ...(await db.query(sql`
          SELECT "entry", "english"[1] "english"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry} AND NOT "isTrad" AND NOT "entry" = ANY(${result.map(
              (r) => r.entry
            )})
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
        }

        if (result.length < limit) {
          result.push(
            ...(await db.query(sql`
          SELECT "entry", "english"[1] "english"
          FROM sentence
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" &@ ${entry} AND "isTrad" AND NOT "entry" = ANY(${result.map(
              (r) => r.entry
            )})
          ORDER BY RANDOM()
          LIMIT ${limit - result.length}
          `))
          )
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
    })

    const sResult = S.shape({
      entry: S.string(),
      alt: S.list(S.string()),
      reading: S.list(S.string()),
      english: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/entry',
      {
        schema: {
          operationId: 'vocabularyGetByEntry',
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

        const r = await lookupVocabulary(entry, userId)

        if (!r) {
          throw { statusCode: 404 }
        }

        return r
      }
    )
  }

  {
    const makeZh = new QSplit({
      default(v) {
        if (/^\p{sc=Han}+$/u.test(v)) {
          return this.fields.entry[':'](v)
        }

        return sql`(${sql.join(
          [this.fields.reading[':'](v), this.fields.english[':'](v)],
          ' OR '
        )})`
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@ ${v}` },
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
          operationId: 'vocabularyQuery',
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
        const hCond = makeZh.parse(q)
        const tagCond = makeTag.parse(q)

        if (!hCond && !qCond && !tagCond) {
          return { result: [] }
        }

        let result = await db.query(sql`
        WITH match_cte AS (
          SELECT
            "simplified", "traditional", "frequency"
          FROM (
            SELECT unnest("entry") "it", "entry"[1] "simplified", unnest("entry"[2:]) "traditional", "frequency"
            FROM "vocabulary"
            WHERE (
              "userId" IS NULL OR "userId" = ${userId}
            ) ${hCond ? sql` AND ${hCond}` : sql``} ${
          qCond
            ? sql` AND "entry" IN (
              SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'vocabulary' AND ${qCond}
            )`
            : sql``
        }
          ) t2
          ${
            tagCond
              ? sql`WHERE "it" IN (
            SELECT "entry"
            FROM entry_tag
            WHERE (
              "userId" IS NULL OR "userId" = ${userId}
            ) AND ${tagCond}
          )`
              : sql``
          }
        )

        SELECT "entry", min("isTrad") "isTrad" FROM (
          SELECT "simplified" "entry", "frequency", 0 "isTrad"
          FROM match_cte
          UNION ALL
          SELECT "traditional" "entry", "frequency", 1 "isTrad"
          FROM match_cte
        ) t1
        WHERE "entry" IS NOT NULL
        GROUP BY "entry"
        ORDER BY min("isTrad"), max("frequency") DESC NULLS FIRST
        LIMIT 20
        `)

        if (result.length && !result[0].isTrad) {
          result = result.filter((r) => !r.isTrad)
        }

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
          operationId: 'vocabularyRandom',
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
          FROM "vocabulary" v
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND t1."entry" = ANY(v."entry")
        ) "english"
        FROM (
          SELECT "entry", "vLevel" "level"
          FROM dict.zhlevel
          WHERE "vLevel" >= ${u['level.min']} AND "vLevel" <= ${u['level.max']}
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
          operationId: 'vocabularyListLevel',
          response: { 200: sResult.valueOf() },
        },
      },
      async (): Promise<typeof sResult.type> => {
        const result: {
          entry: string
          level: number
        }[] = await db.query(sql`
        SELECT "entry", "vLevel" "level"
        FROM dict.zhlevel
        WHERE "vLevel" IS NOT NULL
        `)

        return {
          result,
        }
      }
    )
  }
}

export default vocabularyRouter

export async function lookupVocabulary(
  entry: string,
  userId: string
): Promise<{
  entry: string
  alt: string[]
  reading: string[]
  english: string[]
} | null> {
  const [r] = await db.query(sql`
  SELECT
    "entry"[1] "entry",
    "entry"[2:]||'{}'::text[] "alt",
    "pinyin" "reading",
    "english"
  FROM "vocabulary"
  WHERE (
    "userId" IS NULL OR "userId" = ${userId}
  ) AND ${entry} = ANY("entry")
  `)

  return r || null
}
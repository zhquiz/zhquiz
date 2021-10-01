import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { QSplit, makeQuiz, makeTag, qParseNum } from '../db/token'
import { db } from '../shared'
import { lookupJukuu } from './sentence'
import { makeEnglish, makeReading } from './util'

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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        let result = await db.query(sql`
        SELECT "entry", "english" FROM
        (
          SELECT
            "entry"[1] "entry",
            "translation"[1] "english",
            (CASE
              WHEN "hLevel" <= 50 AND length("entry"[1]) <= 20 THEN 1
              WHEN "hLevel" <= 50 AND length("entry"[1]) > 20 THEN 2
              ELSE 3
            END) "tier"
          FROM "entry"
          WHERE (
            "userId" = uuid_nil() OR "userId" = ${userId}
          ) AND "type" = 'sentence' AND ${
            entry.includes('...')
              ? sql`"entry"[1] LIKE ${
                  '%' + entry.replace(/\.\.\./g, '%') + '%'
                }`
              : sql`"entry" &@ ${entry}`
          }
        ) t1
        ORDER BY "tier", RANDOM()
        LIMIT ${limit}
        `)

        if (result.length < limit) {
          result.push(
            ...(await lookupJukuu(entry).then((rs) =>
              rs.map((r) => ({ entry: r.c, english: r.e }))
            ))
          )
          const entries = result.map((r) => r.entry)
          result = result
            .filter((a, i) => entries.indexOf(a.entry) === i)
            .slice(0, limit)
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
      tag: S.list(S.string()),
      level: S.integer().optional(),
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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        return await lookupVocabulary(entry, userId)
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
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
      '/super',
      {
        schema: {
          operationId: 'vocabularySuper',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const result = await db.query(sql`
        SELECT
          "entry"[1] "entry",
          "entry"[2:]||'{}'::text[] "alt",
          "reading",
          "translation" "english"
        FROM "entry"
        WHERE (
          "userId" = uuid_nil() OR "userId" = ${userId}
        ) AND "type" = 'vocabulary' AND "entry" &@ ${entry} AND ${entry} != ANY("entry")
        LIMIT 5
        `)

        return { result }
      }
    )
  }

  {
    const makeZh = new QSplit({
      default(v) {
        if (/^\p{sc=Han}+$/u.test(v)) {
          return this.fields.entry[':'](v)
        }

        if (/[^\p{L}\p{N}\p{M} :-]/u.test(v)) {
          return null
        }

        return sql`(${sql.join(
          [this.fields.reading[':'](v), this.fields.english[':'](v)],
          ' OR '
        )})`
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@ ${v}` },
        pinyin: { ':': (v) => sql`normalize_pinyin("reading") &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin("reading") &@ ${v}` },
        english: { ':': (v) => sql`"translation" &@ ${v}` },
        translation: { ':': (v) => sql`"translation" &@ ${v}` },
      },
    })

    const makeLevel = new QSplit({
      default: () => null,
      fields: {
        level: qParseNum(sql`"level"`),
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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        q = q.trim()
        if (!q) {
          return { result: [] }
        }

        const qCond = makeQuiz.parse(q)
        const hCond = makeZh.parse(q)
        const tagCond = makeTag.parse(q)
        const lvCond = makeLevel.parse(q)

        if (!hCond && !qCond && !tagCond && !lvCond) {
          return { result: [] }
        }

        let result = await db.query(sql`
        SELECT
          "entry"[1] "entry"
        FROM "entry"
        WHERE (
            "userId" = uuid_nil() OR "userId" = ${userId}
          ) AND "type" = 'vocabulary'
          AND ${hCond || sql`TRUE`}
          AND ${tagCond || sql`TRUE`}
          AND ${lvCond || sql`TRUE`}
          AND ${
            qCond
              ? sql`"entry" IN (
              SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'vocabulary' AND ${qCond}
            )`
              : sql`TRUE`
          }
        ORDER BY "frequency" DESC
        LIMIT 10
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
          operationId: 'vocabularyRandom',
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const [u] = await db.query(sql`
        SELECT "level.min", "level.max" FROM "user" WHERE "id" = ${userId}
        `)

        if (!u) {
          throw { statusCode: 403 }
        }

        u['level.min'] = u['level.min'] || 1
        u['level.max'] = u['level.max'] || 10

        let [r] = await db.query(sql`
        SELECT "entry"[1] "result", floor("level") "level", "translation" "english"
        FROM "entry"
        WHERE
          "type" = 'vocabulary'
          AND "level" >= ${u['level.min']}
          AND "level" < ${u['level.max']} + 1
          AND NOT "entry" && (
            SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "userId" = ${userId} AND "type" = 'vocabulary'
          )
          AND "hLevel" <= 50
        ORDER BY RANDOM()
        LIMIT 1
        `)

        if (!r) {
          ;[r] = await db.query(sql`
          SELECT "entry"[1] "result", floor("level") "level", "translation" "english"
          FROM "entry"
          WHERE
            "type" = 'vocabulay'
            AND "level" >= ${u['level.min']}
            AND "level" < ${u['level.max']} + 1
            AND NOT "entry" && (
              SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "userId" = ${userId} AND "type" = 'vocabulary'
            )
          ORDER BY RANDOM()
          LIMIT 1
          `)
        }

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
}

export default vocabularyRouter

export async function lookupVocabulary(
  entry: string,
  userId: string,
  dontMakeEnglish?: boolean
): Promise<{
  entry: string
  alt: string[]
  reading: string[]
  english: string[]
  tag: string[]
  level?: number
}> {
  if (!/\p{sc=Han}/u.test(entry)) {
    return {
      entry: '',
      alt: [],
      reading: [],
      english: [],
      tag: [],
    }
  }

  let [r] = await db.query(sql`
  SELECT
    "entry"[1] "entry",
    "entry"[2:]||'{}'::text[] "alt",
    "reading",
    "translation" "english",
    "tag",
    "level"
  FROM "entry"
  WHERE (
    "userId" = uuid_nil() OR "userId" = ${userId}
  ) AND "type" = 'vocabulary' AND ${entry} = ANY("entry")
  `)

  if (!r) {
    r = {
      entry,
      alt: [],
      reading: [makeReading(entry)],
      tag: [],
    }

    if (!dontMakeEnglish) {
      r.english = await makeEnglish(entry, userId)
    }
  }

  r.level = r.level || undefined

  return r
}

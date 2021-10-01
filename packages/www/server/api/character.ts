import sql from '@databases/sql'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { QSplit, makeQuiz, makeTag, qParseNum } from '../db/token'
import { db } from '../shared'
import { lookupJukuu } from './sentence'
import { makeEnglish, makeReading } from './util'

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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const [rad] = await db.query(sql`
        SELECT "sub", "sup", "var" FROM radical
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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        let result = await db.query(sql`
        WITH match_cte AS (
          SELECT
            "entry"[1] "entry",
            "entry"[2:]||'{}'::text[] "alt",
            "reading",
            "translation" "english",
            "hLevel"
          FROM "entry"
          WHERE (
            "userId" = uuid_nil() OR "userId" = ${userId}
          ) AND "type" = 'vocabulary' AND "entry" &@ ${entry}
          ORDER BY RANDOM()
        )

        SELECT *
        FROM (
          SELECT * FROM (
            SELECT * FROM match_cte
            WHERE "hLevel" <= 50
          ) t2
          UNION ALL
          SELECT * FROM (
            SELECT * FROM match_cte
            WHERE "hLevel" > 50
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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
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
          ) AND "type" = 'sentence' AND "entry" &@ ${entry}
        ) t1
        ORDER BY "tier", RANDOM()
        LIMIT ${limit}
        `)

        const entries = result.map((r) => r.entry)
        result = result
          .filter((a, i) => entries.indexOf(a.entry) === i)
          .slice(0, limit)

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
          operationId: 'characterGetByEntry',
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

        return await lookupCharacter(entry, userId)
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

        if (/[^\p{L}\p{N}\p{M} :-]/u.test(v)) {
          return null
        }

        return sql`(${sql.join(
          [this.fields.reading[':'](v), this.fields.english[':'](v)],
          ' OR '
        )})`
      },
      fields: {
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
          operationId: 'characterQuery',
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
        const radCond = makeRad.parse(q)
        const hCond = makeZh.parse(q)
        const tagCond = makeTag.parse(q)
        const lvCond = makeLevel.parse(q)

        if (!hCond && !radCond && !qCond && !tagCond && !lvCond) {
          return { result: [] }
        }

        const result = await db.query(sql`
        SELECT DISTINCT "entry"
        FROM (
          SELECT unnest("entry") "entry"
          FROM "entry"
          WHERE ${sql.join(
            [
              sql`("userId" = uuid_nil() OR "userId" = ${userId})`,
              hCond,
              radCond
                ? sql`"entry" IN (SELECT "entry" FROM radical WHERE ${radCond})`
                : null,
              qCond
                ? sql`"entry" IN (
              SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'character' AND ${qCond}
            )`
                : null,
              tagCond,
              lvCond,
            ]
              .filter((s) => s)
              .map((s) => s!),
            ' AND '
          )}
        ) t1
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

        const [r] = await db.query(sql`
        SELECT "entry"[1] "result", floor("level") "level", "translation" "english"
        FROM "entry"
        WHERE (
          "userId" = uuid_nil() OR "userId" = ${userId}
        ) AND "type" = 'character'
        AND "level" >= ${u['level.min']}
        AND "level" <= ${u['level.max']}
        AND NOT "entry" && (
          SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "userId" = ${userId} AND "type" = 'character'
        )
        ORDER BY RANDOM()
        LIMIT 1
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
}

export default characterRouter

export async function lookupCharacter(
  entry: string,
  userId: string
): Promise<{
  entry: string
  reading: string[]
  english: string[]
  tag: string[]
  level?: number
}> {
  if (!/^\p{sc=Han}$/u.test(entry)) {
    throw { statusCode: 400, message: 'not Character' }
  }

  const [r] = await db.query(sql`
  SELECT "entry"[1] "entry", "reading", "translation" "english", "tag", floor("level") "level"
  FROM "entry"
  WHERE (
    "userId" = uuid_nil() OR "userId" = ${userId}
  ) AND "type" = 'character' AND ${entry} = ANY("entry")
  `)

  if (!r) {
    return {
      entry,
      reading: [makeReading(entry)],
      english: await makeEnglish(entry, userId),
      tag: [],
    }
  }

  return r
}

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

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        if (!/^\p{sc=Han}$/u.test(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const fThreshold = 100

        let result = await db.query(sql`
        WITH match_cte AS (
          SELECT
            "entry"[1] "entry",
            "entry"[2:]||'{}'::text[] "alt",
            "pinyin" "reading",
            "english",
            "frequency"
          FROM entries
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "type" = 'vocabulary' AND "entry" &@ ${entry}
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

        if (!result.length) {
          db.query(sql`
          INSERT INTO c2v ("entry", "count")
          VALUES (${entry}, ${0})
          ON CONFLICT DO UPDATE
          SET "count" = EXCLUDED.count
          `)
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
        WITH match_cte AS (
          SELECT s.entry[1] "entry", s."english"[1] english, ("hLevel" > 50) "isTrad"
          FROM entries s
          JOIN "level" si ON si.entry = s.entry[1]
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND s.type = 'sentence' AND s."entry" &@ ${entry}
        )

        SELECT *
        FROM (
          SELECT * FROM (
            SELECT "entry", "english"
            FROM match_cte WHERE NOT "isTrad" AND length("entry") <= 20
            ORDER BY RANDOM()
          ) t1
          UNION
          SELECT * FROM (
            SELECT "entry", "english"
            FROM match_cte WHERE "isTrad" AND length("entry") <= 20
            ORDER BY RANDOM()
          ) t1
          UNION
          SELECT * FROM (
            SELECT "entry", "english"
            FROM match_cte WHERE length("entry") > 20
            ORDER BY RANDOM()
          ) t1
        ) t2
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

        const r = (await lookupCharacter(entry, userId)) || {
          entry,
          reading: [makeReading(entry)],
        }

        const out: typeof sResult.type = {
          ...r,
          english: r.english || [],
          tag: [],
        }

        await Promise.all([
          (async () => {
            if (!out.english.length) {
              out.english = await makeEnglish(r.entry, userId)
            }
          })(),
          (async () => {
            const [{ tag, level }] = await db.query(sql`
            SELECT
              (
                SELECT array_agg(DISTINCT unnest)
                FROM (
                  SELECT unnest("tag")
                  FROM tag
                  WHERE (
                    "userId" IS NULL OR "userId" = ${userId}
                  ) AND "type" = 'character' AND ${r.entry} = ANY("entry")
                ) t1
              )||'{}'::text[] "tag",
              (
                SELECT "hLevel"
                FROM dict.zhlevel
                WHERE "entry" = ${r.entry}
              ) "level"
            `)

            out.tag = tag || []
            out.level = level || undefined
          })(),
        ])

        return out
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
        pinyin: { ':': (v) => sql`normalize_pinyin("pinyin") &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin("pinyin") &@ ${v}` },
        english: { ':': (v) => sql`"english" &@ ${v}` },
      },
    })

    const makeLevel = new QSplit({
      default: () => null,
      fields: {
        level: qParseNum(sql`"hLevel"`),
        hLevel: qParseNum(sql`"hLevel"`),
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
          FROM entries
          WHERE ${sql.join(
            [
              sql`("userId" IS NULL OR "userId" = ${userId})`,
              hCond,
              radCond
                ? sql`"entry" IN (SELECT "entry" FROM dict.radical WHERE ${radCond})`
                : null,
              qCond
                ? sql`"entry" IN (
              SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'character' AND ${qCond}
            )`
                : null,
              tagCond
                ? sql`"entry" IN (
                  SELECT unnest("tag")
                  FROM tag
                  WHERE (
                    "userId" IS NULL OR "userId" = ${userId}
                  ) AND "type" = 'character' AND ${tagCond}
            )`
                : null,
              lvCond
                ? sql`"entry" IN (SELECT "entry" FROM dict.zhlevel WHERE ${lvCond})`
                : null,
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

        let [r] = await db.query(sql`
        SELECT "entry" "result", "level", (
          SELECT "english"
          FROM entries c
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "type" = 'character' AND t1."entry" = ANY(c."entry")
          LIMIT 1
        ) "english"
        FROM (
          SELECT "entry", "hLevel" "level"
          FROM dict.zhlevel
          WHERE
            "hLevel" >= ${u['level.min']}
            AND "hLevel" <= ${u['level.max']}
            AND "entry" NOT IN (
              SELECT "entry" FROM "quiz" WHERE "type" = 'character'
            )
          ORDER BY RANDOM()
          LIMIT 1
        ) t1
        `)

        if (!r) {
          ;[r] = await db.query(sql`
          SELECT "entry" "result", "level", (
            SELECT "english"
            FROM entries c
            WHERE (
              "userId" IS NULL OR "userId" = ${userId}
            ) AND "type" = 'character' AND t1."entry" = ANY(c."entry")
            LIMIT 1
          ) "english"
          FROM (
            SELECT "entry", "hLevel" "level"
            FROM dict.zhlevel
            WHERE
              "hLevel" >= ${u['level.min']}
              AND "hLevel" <= ${u['level.max']}
            ORDER BY RANDOM()
            LIMIT 1
          ) t1
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

export default characterRouter

export async function lookupCharacter(
  entry: string,
  userId: string
): Promise<{
  entry: string
  reading: string[]
  english?: string[]
}> {
  if (!/^\p{sc=Han}$/u.test(entry)) {
    throw { statusCode: 400, message: 'not Character' }
  }

  const [r] = await db.query(sql`
  SELECT "entry"[1] "entry", "pinyin" "reading", "english"
  FROM entries
  WHERE (
    "userId" IS NULL OR "userId" = ${userId}
  ) AND "type" = 'character' AND ${entry} = ANY("entry")
  `)

  if (!r) {
    db.query(sql`
    INSERT INTO log_character ("entry", "count")
    VALUES (${entry}, ${0})
    ON CONFLICT ("entry") DO UPDATE
    SET "count" = EXCLUDED.count
    `)

    return {
      entry,
      reading: [await makeReading(entry)],
    }
  }

  return r
}

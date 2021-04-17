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
        WITH match_cte AS (
          SELECT s.entry "entry", s."english"[1] english, ("hLevel" > 50) "isTrad"
          FROM sentence s
          JOIN "level" si ON si.entry = s.entry
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND s."entry" LIKE '%'||${entry.replace(
            /[^\p{sc=Han}]+/gu,
            '%'
          )}||'%'
        )

        SELECT DISTINCT ON ("entry") *
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

        const r = (await lookupVocabulary(entry, userId)) || {
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
                SELECT array_agg(DISTINCT "tag")
                FROM entry_tag
                WHERE (
                  "userId" IS NULL OR "userId" = ${userId}
                ) AND "type" = 'vocabulary' AND "entry" = ${r.entry}
              )||'{}'::text[] "tag",
              (
                SELECT "vLevel"
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
          "pinyin" "reading",
          "english"
        FROM "vocabulary"
        WHERE (
          "userId" IS NULL OR "userId" = ${userId}
        ) AND "entry" &@ ${entry} AND ${entry} != ANY("entry")
        ORDER BY frequency DESC
        LIMIT 5
        `)

        return { result }
      }
    )
  }

  {
    const sQuery = S.shape({
      entries: S.list(S.string()),
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
      '/entries',
      {
        schema: {
          operationId: 'vocabularyGetByEntries',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entries } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const getEntry = async (entry: string) => {
          const r = await lookupVocabulary(entry, userId)

          let english = r.english || []
          if (!english.length) {
            english = await makeEnglish(entry, userId)
          }

          return {
            ...r,
            english,
          }
        }

        return {
          result: await Promise.all(
            entries
              .filter((a, i, r) => r.indexOf(a) === i)
              .map((it) => getEntry(it))
          ),
        }
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
        pinyin: { ':': (v) => sql`normalize_pinyin("pinyin") &@ ${v}` },
        reading: { ':': (v) => sql`normalize_pinyin("pinyin") &@ ${v}` },
        english: { ':': (v) => sql`"english" &@ ${v}` },
      },
    })

    const makeLevel = new QSplit({
      default: () => null,
      fields: {
        level: qParseNum(sql`"vLevel"`),
        vLevel: qParseNum(sql`"vLevel"`),
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
        WITH match_cte AS (
          SELECT
            "simplified", "traditional", "frequency"
          FROM (
            SELECT unnest("entry") "entry", "entry"[1] "simplified", unnest("entry"[2:]) "traditional", "frequency"
            FROM "vocabulary"
            WHERE (
              "userId" IS NULL OR "userId" = ${userId}
            ) AND ${hCond || sql`TRUE`}
          ) t2
          WHERE
          ${sql.join(
            [
              qCond
                ? sql`"entry" IN (
            SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'vocabulary' AND ${qCond}
          )`
                : null,
              tagCond
                ? sql`"entry" IN (
                    SELECT "entry"
                    FROM entry_tag
                    WHERE (
                      "userId" IS NULL OR "userId" = ${userId}
                    ) AND "type" = 'vocabulary' AND ${tagCond}
                  )`
                : null,
              lvCond
                ? sql`"entry" IN (SELECT "entry" FROM "level" WHERE ${lvCond})`
                : null,
              sql`TRUE`,
            ]
              .filter((s) => s)
              .map((s) => s!),
            ' AND '
          )}
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
          FROM "vocabulary" v
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND t1."entry" = ANY(v."entry")
        ) "english"
        FROM (
          SELECT "entry", "vLevel" "level"
          FROM dict.zhlevel
          WHERE
            "vLevel" >= ${u['level.min']}
            AND "vLevel" <= ${u['level.max']}
            AND "entry" NOT IN (
              SELECT "entry" FROM "quiz" WHERE "type" = 'vocabulary'
            )
          ORDER BY RANDOM()
          LIMIT 1
        ) t1
        `)

        if (!r) {
          ;[r] = await db.query(sql`
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
            WHERE
              "vLevel" >= ${u['level.min']}
              AND "vLevel" <= ${u['level.max']}
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
  english?: string[]
}> {
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

  if (!r) {
    db.query(sql`
    INSERT INTO log_vocabulary ("entry", "count")
    VALUES (${entry}, ${0})
    ON CONFLICT ("entry") DO UPDATE
    SET "count" = EXCLUDED.count
    `)

    return {
      entry,
      alt: [],
      reading: [await makeReading(entry)],
    }
  }

  return r
}

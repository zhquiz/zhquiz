import sql from '@databases/sql'
import axios from 'axios'
import cheerio from 'cheerio'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { QSplit, makeQuiz, makeTag } from '../db/token'
import { db } from '../shared'
import { jiebaCutForSearch, makeEnglish } from './util'
import { lookupVocabulary } from './vocabulary'

const sentenceRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      entry: S.string(),
      english: S.list(S.string()),
      vocabulary: S.list(
        S.shape({
          entry: S.string(),
          alt: S.list(S.string()),
          reading: S.list(S.string()),
          english: S.list(S.string()),
        })
      ),
      tag: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/entry',
      {
        schema: {
          operationId: 'sentenceGetByEntry',
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

        const r = (await lookupSentence(entry, userId)) || {
          entry,
        }

        const out: typeof sResult.type = {
          ...r,
          english: r.english || [],
          vocabulary: [],
          tag: [],
        }

        await Promise.all([
          (async () => {
            if (!out.english.length) {
              out.english = await makeEnglish(r.entry, userId)
            } else {
              out.vocabulary = await cutForVocabulary(r.entry, userId)
            }
          })(),
          (async () => {
            const [{ tag }] = await db.query(sql`
            SELECT DISTINCT unnest "tag"
            FROM (
              SELECT unnest("tag")
              FROM tag
              WHERE (
                "userId" IS NULL OR "userId" = ${userId}
              ) AND "type" = 'character' AND ${entry} = ANY("entry")
            ) t1
            `)

            out.tag = tag || []
          })(),
        ])

        return out
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
    })

    const sResponse = S.shape({
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
          operationId: 'sentenceVocabulary',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        return {
          result: await cutForVocabulary(req.query.q, userId),
        }
      }
    )
  }

  {
    const makeZh = new QSplit({
      default(v) {
        return sql`(${sql.join(
          [this.fields.entry[':'](v), this.fields.english[':'](v)],
          ' OR '
        )})`
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@ ${v}` },
        english: { ':': (v) => sql`"english" &@ ${v}` },
      },
    })

    const sQuery = S.shape({
      q: S.string(),
      limit: S.integer().optional(),
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
          operationId: 'sentenceQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        let { q, limit = 10 } = req.query

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

        if (!hCond && !qCond && !tagCond) {
          return { result: [] }
        }

        let result = await db.query(sql`
        WITH match_cte AS (
          SELECT DISTINCT ON ("entry") *
          FROM (
            SELECT
              "entry"[1] "entry", (SELECT "hLevel" > 50 FROM "level" WHERE "entry" = sentence."entry") "isTrad"
            FROM entries
            WHERE (
              "userId" IS NULL OR "userId" = ${userId}
            ) AND "type" = 'sentence' ${hCond ? sql` AND ${hCond}` : sql``} ${tagCond
            ? sql` AND "entry" IN (
                SELECT unnest("tag")
                FROM tag
                WHERE (
                  "userId" IS NULL OR "userId" = ${userId}
                ) AND "type" = 'sentence' AND ${tagCond}
              )`
            : sql``
          } ${qCond
            ? sql` AND "entry" IN (
              SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'sentence' AND ${qCond}
            )`
            : sql``
          }
          ) t1
        )

        SELECT "entry" FROM (
          SELECT "entry" FROM match_cte WHERE NOT "isTrad" ORDER BY RANDOM()
        ) t1
        UNION ALL
        SELECT "entry" FROM (
          SELECT "entry" FROM match_cte WHERE "isTrad" ORDER BY RANDOM()
        ) t1
        LIMIT ${limit}
        `)

        result = result.map((r) => r.entry)
        if (result.length < limit) {
          result.push(
            ...(await lookupJukuu(q).then((rs) => rs.map((r) => r.c)))
          )
        }

        return {
          result,
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
          operationId: 'sentenceRandom',
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
        SELECT "entry" "result", (
          SELECT "english"[1] FROM entries s WHERE t1."entry" = ANY(s."entry") LIMIT 1
        ) "english", "vLevel" "level"
        FROM (
          SELECT "entry", "vLevel" FROM "level"
          WHERE
            "vLevel" >= ${u['level.min']}
            AND "vLevel" <= ${u['level.max']}
            AND "entry" NOT IN (
              SELECT "entry" FROM "quiz" WHERE "type" = 'sentence'
            )
          ORDER BY RANDOM()
          LIMIT 1
        ) t1
        `)

        if (!r) {
          ;[r] = await db.query(sql`
          SELECT "entry" "result", (
            SELECT "english"[1] FROM entries s WHERE t1."entry" = ANY(s."entry") LIMIT 1
          ) "english", "vLevel" "level"
          FROM (
            SELECT "entry", "vLevel" FROM "level"
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
          english: r.english,
          level: r.level,
        }
      }
    )
  }
}

export default sentenceRouter

export async function lookupSentence(
  entry: string,
  userId: string
): Promise<{
  entry: string
  english?: string[]
}> {
  if (!/\p{sc=Han}/u.test(entry)) {
    return {
      entry: '',
      english: [],
    }
  }

  const [r] = await db.query(sql`
  SELECT
    "entry"[1] "entry", "english"
  FROM entries
  WHERE (
    "userId" IS NULL OR "userId" = ${userId}
  ) AND "type" = 'sentence' AND ${entry} = ANY("entry")
  `)

  return r || { entry }
}

export async function lookupJukuu(
  q: string
): Promise<
  {
    c: string
    e: string
  }[]
> {
  if (!/\p{sc=Han}/u.test(q)) {
    return []
  }

  const rs: {
    c: string
    e: string
  }[] = await db.query(sql`
  SELECT "chinese" c, "english" e
  FROM online.jukuu
  WHERE "chinese" &@ ${q}
  `)
  if (rs.length < 10) {
    const [r] = await db.query(sql`
    SELECT "count"
    FROM online.jukuu_history
    WHERE "q" = ${q}
    `)

    if (!r || r.count < 10) {
      const { data: html } = await axios.get(
        `http://www.jukuu.com/search.php`,
        {
          params: {
            q,
          },
          transformResponse: [],
        }
      )

      const $ = cheerio.load(html)
      let out = Array.from({ length: 10 }).map(() => ({ c: '', e: '' }))

      $('table tr.c td:last-child').each((i, el) => {
        out[i].c = $(el).text()
      })

      $('table tr.e td:last-child').each((i, el) => {
        out[i].e = $(el).text()
      })

      out = out.filter((r) => r.c)

      await db.tx(async (db) => {
        await db.query(sql`
        INSERT INTO online.jukuu_history ("q", "count")
        VALUES (${q}, ${out.length})
        ON CONFLICT ("q")
        DO UPDATE
        SET "count" = ${out.length}
        `)

        if (out.length) {
          await db.query(sql`
          INSERT INTO online.jukuu ("chinese", "english")
          VALUES ${sql.join(
            out.map((r) => sql`(${r.c}, ${r.e})`),
            ','
          )}
          ON CONFLICT DO NOTHING
          `)
        }
      })

      rs.push(...out)
    }
  }

  return rs.slice(0, 10)
}

async function cutForVocabulary(q: string, userId: string) {
  return Promise.all(
    jiebaCutForSearch(q).map(async (seg) => {
      const r = await lookupVocabulary(seg, userId)
      return {
        ...r,
        english: r.english || [],
      }
    })
  )
}

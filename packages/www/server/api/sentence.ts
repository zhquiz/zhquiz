import sql from '@databases/sql'
import axios from 'axios'
import cheerio from 'cheerio'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { refresh } from '../db/refresh'
import { QSplit, makeQuiz, makeTag } from '../db/token'
import { db } from '../shared'

const sentenceRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      entry: S.string(),
      english: S.list(S.string()),
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

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await lookupSentence(entry, userId)

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
          SELECT DISTINCT ON ("entry")
            "entry", "isTrad"
          FROM "sentence"
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) ${hCond ? sql` AND ${hCond}` : sql``} ${
          tagCond
            ? sql` AND "entry" IN (
              SELECT "entry"
              FROM entry_tag
              WHERE (
                "userId" IS NULL OR "userId" = ${userId}
              ) AND "type" = 'sentence' AND ${tagCond}
            )`
            : sql``
        } ${
          qCond
            ? sql` AND "entry" IN (
            SELECT "entry" FROM quiz WHERE "userId" = ${userId} AND "type" = 'sentence' AND ${qCond}
          )`
            : sql``
        }
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
        SELECT "result", "english", "level"
        FROM f_sentence_random(${u['level.min']}, ${u['level.max']})
        `)

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
  english: string[]
} | null> {
  const [r] = await db.query(sql`
  SELECT
    "entry", "english"
  FROM "sentence"
  WHERE (
    "userId" IS NULL OR "userId" = ${userId}
  ) AND "entry" = ${entry}
  `)

  return r || null
}

export async function lookupJukuu(
  q: string
): Promise<
  {
    c: string
    e: string
  }[]
> {
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

      if (out.length) {
        refresh('sentence').then(() =>
          Promise.all([
            refresh('"sentence_isTrad"'),
            refresh('dict.cedict_view'),
          ])
        )
      }

      rs.push(...out)
    }
  }

  return rs.slice(0, 10)
}

import sql from '@databases/sql'
import axios from 'axios'
import cheerio from 'cheerio'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import { Frequency, Level } from '@patarapolw/zhlevel'

import { QSplit, makeQuiz, makeTag } from '../db/token'
import { db } from '../shared'
import { jiebaCutForSearch, makeEnglish, makeReading } from './util'
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

        return await lookupSentence(entry, userId)
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
        english: { ':': (v) => sql`"translation" &@ ${v}` },
        translation: { ':': (v) => sql`"translation" &@ ${v}` },
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
          SELECT
            "entry"[1] "entry", floor("level") "level"
          FROM "entry" e1
          WHERE (
            "userId" = uuid_nil() OR "userId" = ${userId}
          ) AND "type" = 'sentence'
          ${hCond ? sql` AND ${hCond}` : sql``}
          ${tagCond ? sql` AND ${tagCond}` : sql``}
          ${
            qCond
              ? sql` AND "entry" IN (
              SELECT "entry" FROM "quiz" WHERE "userId" = ${userId} AND "type" = 'sentence' AND "entry" = ANY(e1."entry") AND ${qCond}
            )`
              : sql``
          }
        )

        SELECT "entry" FROM (
          SELECT "entry" FROM match_cte WHERE "level" <= 60 ORDER BY RANDOM()
        ) t1
        UNION ALL
        SELECT "entry" FROM (
          SELECT "entry" FROM match_cte WHERE "level" > 60 ORDER BY RANDOM()
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
          result: result.slice(0, limit),
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
        SELECT "entry"[1] "result", "translation"[1] "english", floor("level") "level"
        FROM "entry"
        WHERE
          "type" = 'sentence'
          AND "level" >= ${u['level.min']}
          AND "level" <= ${u['level.max']}
          AND NOT "entry" && (
            SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "userId" = ${userId} AND "type" = 'sentence'
          )
          AND "hLevel" <= 50
        ORDER BY RANDOM()
        LIMIT 1
        `)

        if (!r) {
          ;[r] = await db.query(sql`
          SELECT "entry"[1] "result", "translation"[1] "english", floor("level") "level"
          FROM "entry"
          WHERE
          "type" = 'sentence'
            AND "level" >= ${u['level.min']}
            AND "level" <= ${u['level.max']}
            AND NOT "entry" && (
              SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "userId" = ${userId} AND "type" = 'sentence'
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
  reading: string[]
  english: string[]
  tag: string[]
  vocabulary: any[]
}> {
  if (!/\p{sc=Han}/u.test(entry)) {
    return {
      entry: '',
      reading: [],
      english: [],
      tag: [],
      vocabulary: [],
    }
  }

  const [r] = await db.query(sql`
  SELECT
    "entry"[1] "entry", "reading", "translation" "english", "tag"
  FROM "entry"
  WHERE (
    "userId" = uuid_nil() OR "userId" = ${userId}
  ) AND "type" = 'sentence' AND ${entry} = ANY("entry")
  `)

  if (!r) {
    return {
      entry,
      reading: [makeReading(entry)],
      english: await makeEnglish(entry, userId),
      tag: [],
      vocabulary: [],
    }
  }

  return {
    ...r,
    vocabulary: await cutForVocabulary(entry, userId),
  }
}

export async function lookupJukuu(q: string): Promise<
  {
    c: string
    e: string
  }[]
> {
  if (!/\p{sc=Han}/u.test(q)) {
    return []
  }

  const [r] = await db.query(sql`
    SELECT "count" FROM "jukuu_lookup" WHERE "q" = ${q}
  `)

  if (r && !r.count) {
    return []
  }

  const { data: html } = await axios.get(`http://www.jukuu.com/search.php`, {
    params: {
      q,
    },
    transformResponse: [],
  })

  const $ = cheerio.load(html)
  let out = Array.from({ length: 10 }).map(() => ({ c: '', e: '' }))

  $('table tr.c td:last-child').each((i, el) => {
    out[i].c = $(el).text()
  })

  $('table tr.e td:last-child').each((i, el) => {
    out[i].e = $(el).text()
  })

  const allChinese: string[] = []
  out = out
    .filter((r) => {
      if (r.c) {
        allChinese.push(r.c)
        return true
      }
      return false
    })
    .filter((r, i) => {
      return allChinese.indexOf(r.c) === i
    })

  const f = new Frequency()
  const lv = new Level()

  await db.tx(async (db) => {
    await db.query(sql`
    INSERT INTO "jukuu_lookup" ("q", "count")
    VALUES (${q}, ${out.length})
    ON CONFLICT ("q")
    DO UPDATE
    SET "count" = ${out.length}
    `)

    if (out.length) {
      await db.query(sql`
      INSERT INTO "entry" ("type", "entry", "reading", "translation", "tag", "frequency", "level", "hLevel")
        VALUES ${sql.join(
          out.map(
            (r) =>
              sql`('sentence', ${[r.c]}, ${[makeReading(r.c)]}, ${[r.e]}, ${[
                'jukuu',
              ]}, ${f.vFreq(r.c)}, ${lv.vLevel(r.c)}, ${lv.hLevel(r.c)})`
          ),
          ','
        )}
        ON CONFLICT (("entry"[1]), "type", "userId") DO UPDATE SET
          "translation" = array_distinct("entry"."translation"||EXCLUDED."translation"),
          "tag" = array_distinct("entry"."tag"||EXCLUDED."tag")
      `)
    }
  })

  return out
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

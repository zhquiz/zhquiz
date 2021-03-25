import sql from '@databases/sql'
// @ts-ignore
import toPinyin from 'chinese-to-pinyin'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { db } from '../shared'

const entryRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      entry: S.list(S.string()).minItems(1),
      reading: S.list(S.string()),
      english: S.list(S.string()),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/extra/id',
      {
        schema: {
          operationId: 'extraGetById',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const [r] = await db.query(sql`
        SELECT "entry", "pinyin", "english", "description", "tag", "type"
        FROM "extra"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `)

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          entry: r.entry,
          reading: r.pinyin,
          english: r.english,
          type: r.type,
          description: r.description,
          tag: r.tag,
        }
      }
    )
  }

  {
    const sResponse = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      reading: S.list(S.string()),
      english: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'entryCreate',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry, reading, english, type, description, tag } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (
          type === 'character' &&
          !entry.every((it) => /^\p{sc=Han}$/u.test(it))
        ) {
          throw { statusCode: 400, message: 'not all Hanzi' }
        }

        if (!reading.length) {
          reading.push(toPinyin(entry[0], { keepRest: true }))
        }

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "extra" ("entry", "pinyin", "english", "description", "tag", "type", "userId", "id")
          VALUES (${entry}, ${reading}, ${english}, ${description}, ${tag}, ${type}, ${userId}, ${id})
          `)

          return id
        })

        reply.status(201)
        return {
          id,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      reading: S.list(S.string()),
      english: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      description: S.string(),
      tag: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'entryUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query
        const { entry, reading, english, type, description, tag } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (
          type === 'character' &&
          !entry.every((it) => /^\p{sc=Han}$/u.test(it))
        ) {
          throw { statusCode: 400, message: 'not all Hanzi' }
        }

        if (!reading.length) {
          reading.push(toPinyin(entry[0], { keepRest: true }))
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "extra"
          SET
            "entry" = ${entry},
            "pinyin" = ${reading},
            "english" = ${english},
            "description" = ${description},
            "tag" = ${tag},
            "type" = ${type}
          WHERE "userId" = ${userId} AND "id" = ${id}
          `)
        })

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'entryDelete',
          querystring: sQuery.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          DELETE FROM "extra"
          WHERE "userId" = ${userId} AND "id" = ${id}
          `)
        })

        reply.status(201)
        return {
          result: 'deleted',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
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
          operationId: 'entryGetByEntry',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, type } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        let r: typeof sResult.type

        if (type === 'character') {
          ;[r] = await db.query(sql`
          SELECT "entry", "pinyin" "reading", "english"
          FROM "character"
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" = ${entry}
          `)

          if (r) {
            r.alt = []
          }
        } else if (type === 'vocabulary') {
          ;[r] = await db.query(sql`
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
        } else {
          ;[r] = await db.query(sql`
          SELECT
            "entry", "english"
          FROM "sentence"
          WHERE (
            "userId" IS NULL OR "userId" = ${userId}
          ) AND "entry" = ${entry}
          `)

          if (r) {
            r.alt = []
            r.reading = []
          }
        }

        if (!r) {
          throw { statusCode: 404 }
        }

        return r
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
      page: S.integer().optional(),
      limit: S.integer().optional(),
      all: S.boolean().optional(),
      type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
      select: S.string().description(
        'Comma separated: entry, alt, reading, english, type, description, source, tag'
      ),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          entry: S.string(),
          alt: S.list(S.string()),
          reading: S.list(
            S.shape({
              type: S.string().optional(),
              kana: S.string(),
            })
          ),
          english: S.list(S.string()),
          type: S.string(),
          description: S.string(),
          source: S.string().optional(),
          tag: S.list(S.string()),
        })
      ),
      count: S.integer(),
    })

    const makeRad = new QSplit({
      default: (v) => {
        if (/^\p{sc=Han}{2,}$/u.test(v)) {
          const re = /\p{sc=Han}/gu
          let m = re.exec(v)
          const out: string[] = []
          while (m) {
            out.push(m[0]!)
            m = re.exec(v)
          }

          return {
            $or: out.map((v) => {
              return { entry: v }
            }),
          }
        } else if (isHan(v)) {
          return { $or: [{ entry: v }, { sub: v }, { sup: v }, { var: v }] }
        }

        return {}
      },
      fields: {
        entry: { ':': (v) => ({ entry: v }) },
        kanji: { ':': (v) => ({ entry: v }) },
        sub: { ':': (v) => ({ sub: v }) },
        sup: { ':': (v) => ({ sup: v }) },
        var: { ':': (v) => ({ var: v }) },
      },
    })

    const makeQuiz = new QSplit({
      default: () => ({}),
      fields: {
        srsLevel: qNumberUndefined('srsLevel'),
        nextReview: qDateUndefined('nextReview'),
        lastRight: qDateUndefined('lastRight'),
        lastWrong: qDateUndefined('lastWrong'),
        maxRight: qNumberUndefined('maxRight'),
        maxWrong: qNumberUndefined('maxWrong'),
        rightStreak: qNumberUndefined('rightStreak'),
        wrongStreak: qNumberUndefined('wrongStreak'),
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'entryQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { page = 1, limit = 10, all, type, select } = req.query
        let { q } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!select) {
          throw { statusCode: 400, message: 'select is required' }
        }

        q = q.trim()

        let entries: string[] | null = null
        if (type === 'character') {
          const m = /(^| )\p{sc=Han}+( |$)/u.exec(q)
          if (m) {
            q = q.replace(m[1]!, ' ').trim()
            const rCond = makeRad.parse(m[0])

            if (rCond) {
              entries = await RadicalModel.find(rCond)
                .select('-_id entry')
                .then((rs) => rs.map((r) => r.entry))

              if (!entries?.length) {
                return { result: [], count: 0 }
              }
            }
          }
        }

        const makeJa = new QSplit({
          default: (v) => {
            if (entries) {
              return {}
            }

            return {
              $or: [
                { entry: v },
                { segments: v },
                // { 'reading.kana': katakanaToHiragana(romajiToHiragana(v)) },
                { $text: { $search: v } },
              ],
            }
          },
          fields: {
            entry: { ':': (v) => ({ $or: [{ entry: v }, { segments: v }] }) },
            onyomi: {
              ':': (v) => ({
                reading: {
                  type: 'onyomi',
                  kana: katakanaToHiragana(romajiToHiragana(v)),
                },
              }),
            },
            kunyomi: {
              ':': (v) => ({
                reading: {
                  type: 'kunyomi',
                  kana: katakanaToHiragana(romajiToHiragana(v)),
                },
              }),
            },
            nanori: {
              ':': (v) => ({
                reading: {
                  type: 'nanori',
                  kana: katakanaToHiragana(romajiToHiragana(v)),
                },
              }),
            },
            reading: {
              ':': (v) => ({ 'reading.kana': v }),
            },
            english: { ':': (v) => ({ $text: { $search: v } }) },
            type: { ':': (v) => ({ type: v }) },
          },
        })

        const dCond = makeJa.parse(q) || {}
        const qCond = makeQuiz.parse(q) || {}

        const rs = await EntryModel.aggregate([
          {
            $match: {
              $and: [
                ...(type ? [{ type }] : []),
                ...(entries ? [{ entry: { $in: entries } }] : []),
                dCond,
                {
                  $or: [
                    { userId },
                    { sharedId: userId },
                    ...(all ? [{ userId: { $exists: false } }] : []),
                  ],
                },
              ],
            },
          },
          ...(Object.keys(qCond).length > 0
            ? [
                {
                  $lookup: {
                    from: 'Quiz',
                    let: { entry: '$entry', type: '$type' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$entry', '$$entry'] },
                              { $eq: ['$type', '$$type'] },
                            ],
                          },
                        },
                      },
                      {
                        $match: qCond,
                      },
                    ],
                    as: 'q',
                  },
                },
                { $match: { 'q.0': { $exists: true } } },
              ]
            : []),
          {
            $facet: {
              result: [
                { $sort: { updatedAt: -1 } },
                ...(limit !== -1
                  ? [{ $skip: (page - 1) * limit }, { $limit: limit }]
                  : []),
                {
                  $project: select
                    .split(',')
                    .reduce(
                      (prev, k) => ({ ...prev, [k]: 1 }),
                      {} as Record<string, number>
                    ),
                },
              ],
              count: [{ $count: 'count' }],
            },
          },
        ])

        if (!rs[0]) {
          return {
            result: [],
            count: 0,
          }
        }

        const rMap: Record<
          'user' | 'wanikani' | 'others',
          {
            id: string
            entry: string
            alt: string[]
            reading: {
              type?: string
              kana: string
            }[]
            english: string[]
            type: string
            description: string
            source?: string
            tag: string[]
          }[]
        > = {
          user: [],
          wanikani: [],
          others: [],
        }

        rs[0].result.map((d: any) => {
          const v = {
            id: d._id,
            entry: d.entry[0],
            alt: d.entry.slice(1),
            reading: (d.reading as any[])
              .filter((r) => !r.hidden)
              .map(({ type, kana }) => ({ type, kana })),
            english: d.english,
            type: d.type,
            description: d.description,
            source: d.source,
            tag: d.tag,
          }

          switch (d.source) {
            case undefined:
              rMap.user.push(v)
              break
            case 'wanikani':
              rMap.user.push(v)
              break
            default:
              rMap.others.push(v)
          }
        })

        return {
          result: [...rMap.user, ...rMap.wanikani, ...rMap.others],
          count: rs[0].count[0].count,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      type: S.string().enum('character', 'vocabulary', 'sentence'),
    })

    const sResult = S.shape({
      result: S.string(),
      english: S.string(),
      level: S.integer(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/random',
      {
        schema: {
          operationId: 'entryRandom',
          querystring: sQuery.valueOf(),
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { type } = req.query

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

        let r: typeof sResult.type

        if (type === 'character') {
          ;[r] = await db.query(sql`
          SELECT "entry" "result", "level", (
            SELECT "english"[1]
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
        } else if (type === 'vocabulary') {
          ;[r] = await db.query(sql`
          SELECT "entry" "result", "level", (
            SELECT "english"[1]
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
        } else {
          ;[r] = await db.query(sql`
          SELECT "result", "english", "level"
          FROM f_sentence_random(${u['level.min']}, ${u['level.max']})
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

  {
    const sQuery = S.shape({
      type: S.string().enum('character', 'vocabulary'),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          level: S.integer(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/level',
      {
        schema: {
          operationId: 'entryListLevel',
          querystring: sQuery.valueOf(),
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { type } = req.query

        let result: {
          entry: string
          level: number
        }[] = []

        if (type === 'character') {
          result = await db.query(sql`
          SELECT "entry", "hLevel" "level"
          FROM dict.zhlevel
          WHERE "hLevel" IS NOT NULL
          `)
        } else {
          result = await db.query(sql`
          SELECT "entry", "vLevel" "level"
          FROM dict.zhlevel
          WHERE "vLevel" IS NOT NULL
          `)
        }

        return {
          result,
        }
      }
    )
  }
}

export default entryRouter

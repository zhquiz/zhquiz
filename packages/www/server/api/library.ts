import { sql } from '@databases/pg'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import shortUUID from 'short-uuid'

import { QSplit } from '../db/token'
import { db } from '../shared'
import { lookupCharacter } from './character'
import { lookupSentence } from './sentence'
import { makeEnglish, makeReading } from './util'
import { lookupVocabulary } from './vocabulary'

const libraryRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      entries: S.list(
        S.shape({
          entry: S.string(),
          alt: S.list(S.string()).optional(),
          reading: S.list(S.string()).optional(),
          english: S.list(S.string()).optional(),
        })
      ),
      title: S.string(),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
      isShared: S.boolean().optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryGetOne',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const [r] = await db
          .query(
            sql`
        SELECT
          "entries",
          "title",
          "type",
          "description",
          "tag",
          "isShared"
        FROM "library"
        WHERE "userId" = ${userId} AND "id" = ${id}
        `
          )
          .then((rs) =>
            rs.map((r) => {
              return {
                entries: r.entries,
                title: r.title,
                type: r.type,
                description: r.description,
                tag: r.tag,
              }
            })
          )

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
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string().optional(),
          entries: S.list(
            S.shape({
              entry: S.string(),
              alt: S.list(S.string()).optional(),
              reading: S.list(S.string()).optional(),
              english: S.list(S.string()).optional(),
            })
          ),
          title: S.string(),
          type: S.string(),
          description: S.string(),
          tag: S.list(S.string()),
          isShared: S.boolean().optional(),
        })
      ),
      count: S.integer(),
    })

    const makeZh = new QSplit({
      default(v) {
        return sql`(${sql.join(
          [
            this.fields.entry[':'](v),
            this.fields.title[':'](v),
            this.fields.description[':'](v),
            this.fields.tag[':'](v),
          ],
          ' OR '
        )})`
      },
      fields: {
        entry: { ':': (v) => sql`"entry" &@ ${v}` },
        title: { ':': (v) => sql`"title" &@ ${v}` },
        type: {
          ':': (v) => {
            if (v === 'hanzi' || v === 'kanji') v = 'character'
            return sql`"type" = ${v}`
          },
        },
        description: { ':': (v) => sql`"description" &@ ${v}` },
        tag: { ':': (v) => sql`"tag " &@ ${v}` },
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'libraryQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q, page = 1, limit = 10 } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const [r] = await db.query(
          sql`
          WITH match_cte AS (
            SELECT
              "entries",
              "title",
              "type",
              "description",
              "tag",
              (CASE WHEN "userId" = ${userId} THEN "id" END) "id",
              "updatedAt",
              "isShared"
            FROM "library"
            WHERE (
              "isShared" OR "userId" = ${userId}
            ) AND ${makeZh.parse(q) || sql`TRUE`}
            ORDER BY "updatedAt" DESC, "createdAt" DESC, "title"
          )

          SELECT
          (
            SELECT json_agg(row_to_json)
            FROM (
              SELECT row_to_json(t)
              FROM (
                SELECT * FROM (
                  SELECT * FROM (
                    SELECT * FROM match_cte
                    WHERE "id" IS NOT NULL
                  ) t1
                  UNION ALL
                  SELECT * FROM (
                    SELECT * FROM match_cte
                    WHERE "id" IS NULL
                  ) t1
                ) t2
                LIMIT ${limit} OFFSET ${(page - 1) * limit}
              ) t
            ) t3
          ) result,
          (
            SELECT COUNT(*) FROM match_cte
          ) "count"
          `
        )

        return {
          result: ((r.result as any[]) || []).map((r) => {
            return {
              id: r.id || undefined,
              entries: r.entries,
              title: r.title,
              type: r.type,
              description: r.description,
              tag: r.tag,
              isShared: r.isShared,
            }
          }),
          count: r.count,
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entries: S.list(
        S.shape({
          entry: S.string(),
          alt: S.list(S.string()).optional(),
          reading: S.list(S.string()).optional(),
          english: S.list(S.string()).optional(),
        })
      ).minItems(1),
      title: S.string(),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
      isShared: S.boolean().optional(),
    })

    const sResult = S.shape({
      id: S.string(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryCreate',
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { title, type, description, tag, entries, isShared } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const id = await db.tx(async (db) => {
          const id = shortUUID.uuid()

          await db.query(sql`
          INSERT INTO "library" ("id", "userId", "title", "type", "description", "tag", "entries", "isShared")
          VALUES (${id}, ${userId} ${title}, ${type}, ${description}, ${tag}, ${JSON.stringify(
            entries
          )}::jsonb, ${isShared})
          `)

          return id
        })

        reply.status(201)
        return { id }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      entries: S.list(
        S.shape({
          entry: S.string(),
          alt: S.list(S.string()).optional(),
          reading: S.list(S.string()).optional(),
          english: S.list(S.string()).optional(),
        })
      )
        .minItems(1)
        .optional(),
      title: S.string().optional(),
      type: S.string().optional(),
      description: S.string().optional(),
      tag: S.list(S.string()).optional(),
      isShared: S.boolean().optional(),
    })

    const sResult = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id } = req.query
        const { title, type, description, tag, entries, isShared } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.tx(async (db) => {
          await db.query(sql`
          UPDATE "library"
          SET ${sql.join(
            [
              ...(typeof title !== 'undefined'
                ? [sql`"title" = ${title}`]
                : []),
              ...(typeof type !== 'undefined' ? [sql`"type" = ${type}`] : []),
              ...(typeof description !== 'undefined'
                ? [sql`"description" = ${description}`]
                : []),
              ...(typeof tag !== 'undefined' ? [sql`"tag" = ${tag}`] : []),
              ...(typeof entries !== 'undefined'
                ? [sql`"entries" = ${JSON.stringify(entries)}::jsonb`]
                : []),
              ...(typeof isShared !== 'undefined'
                ? [sql`"isShared" = ${isShared}`]
                : []),
            ],
            ','
          )}
          WHERE ${userId} = "userId" AND "id" = ${id}
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

    const sResult = S.shape({
      result: S.string(),
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryDelete',
          querystring: sQuery.valueOf(),
          response: {
            201: sResult.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResult.type> => {
        const { id } = req.query

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        await db.query(sql`
        DELETE FROM "library"
        WHERE ${userId} = "userId" AND "id" = ${id}
        `)

        reply.status(201)
        return {
          result: 'deleted',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      type: S.string().enum('vocabulary', 'character'),
      whatToShow: S.string(),
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
          operationId: 'libraryListLevel',
          querystring: sQuery.valueOf(),
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { type, whatToShow } = req.query

        let cond = sql`TRUE`

        if (whatToShow === 'all-quiz') {
          cond = sql`"entry" && (
            SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "type" = ${type}
          )`
        } else if (whatToShow === 'learning') {
          cond = sql`"entry" && (
            SELECT array_agg("entry")||'{}'::text[] FROM "quiz" WHERE "type" = ${type} AND ("srsLevel" IS NULL OR "srsLevel" <= 2)
          )`
        }

        const result: {
          entry: string
          level: number
        }[] = await db.query(sql`
        SELECT "entry"[1] "entry", floor("level") "level"
        FROM "entry"
        WHERE "type" = ${type} AND 'zhlevel' = ANY("tag") AND ${cond}
        `)

        return {
          result,
        }
      }
    )
  }

  {
    const sBody = S.shape({
      type: S.string().enum('character', 'vocabulary', 'sentence'),
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

    f.post<{
      Body: typeof sBody.type
    }>(
      '/entries',
      {
        schema: {
          operationId: 'libraryGetByEntries',
          body: sBody.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { type, entries } = req.body

        const userId: string = req.session.userId
        if (!userId) {
          throw { statusCode: 403 }
        }

        const getEntry = async (entry: string) => {
          const r: {
            entry: string
            alt?: string[]
            reading?: string[]
            english?: string[]
          } = await (type === 'character'
            ? lookupCharacter(entry, userId)
            : type === 'sentence'
            ? lookupSentence(entry, userId)
            : lookupVocabulary(entry, userId))

          let english = r.english || []
          if (!english.length) {
            english = await makeEnglish(entry, userId)
          }

          return {
            ...r,
            alt: r.alt || [],
            reading: r.reading || [makeReading(r.entry)],
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
}

export default libraryRouter

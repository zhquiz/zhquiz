import { FastifyInstance } from 'fastify'
import sqlite3 from 'better-sqlite3'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const zh = sqlite3('assets/zh.db', { readonly: true })
  const stmt = {
    sentenceQ (opts: {
      limit: number
      offset: number
    }) {
      return zh.prepare(/*sql*/`
      SELECT chinese, pinyin, english
      FROM sentence
      WHERE chinese LIKE ?
      ORDER BY frequency DESC
      LIMIT ${opts.limit} OFFSET ${opts.offset}
      `)
    },
    sentenceQCount: zh.prepare(/*sql*/`
    SELECT COUNT(*) AS [count]
    FROM sentence
    WHERE chinese LIKE ?
    `),
    sentenceLevel: zh.prepare(/*sql*/`
    SELECT chinese, [level]
    FROM sentence
    WHERE [level] <= ? AND [level] >= ?
    ORDER BY RANDOM()`)
  }

  f.post('/q', {
    schema: {
      tags: ['sentence'],
      summary: 'Query for a given sentence',
      body: {
        type: 'object',
        required: ['entry'],
        properties: {
          entry: { type: 'string' },
          offset: { type: 'integer' },
          limit: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'array',
              items: {
                type: 'object',
                required: ['chinese', 'english'],
                properties: {
                  chinese: { type: 'string' },
                  pinyin: { type: 'string' },
                  english: { type: 'string' }
                }
              }
            },
            count: { type: 'integer' },
            offset: { type: 'integer' },
            limit: { type: 'integer' }
          }
        }
      }
    }
  }, async (req) => {
    const { entry, offset = 0, limit = 10 } = req.body

    return {
      result: stmt.sentenceQ({
        offset, limit
      }).all(`%${entry}%`),
      count: (stmt.sentenceQCount.get(`%${entry}%`) || {}).count || 0,
      offset,
      limit
    }
  })

  f.post('/random', {
    schema: {
      tags: ['sentence'],
      summary: 'Randomize a sentence for a given level',
      body: {
        type: 'object',
        properties: {
          level: { type: 'integer' },
          levelMin: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: { type: 'string' },
            level: { type: 'integer' }
          }
        }
      }
    }
  }, async (req) => {
    const { levelMin, level } = req.body
    const s = stmt.sentenceLevel.get(level || 60, levelMin || 1) || {} as any

    return {
      result: s.chinese,
      level: s.level
    }
  })

  next()
}

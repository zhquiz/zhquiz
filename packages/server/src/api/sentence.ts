import { FastifyInstance } from 'fastify'
import pinyin from 'chinese-to-pinyin'
import { zh } from '../db/local'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/match', {
    schema: {
      tags: ['sentence'],
      summary: 'Get sentence data',
      body: {
        type: 'object',
        required: ['entry'],
        properties: {
          entry: { type: 'string' }
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
                properties: {
                  chinese: { type: 'string' },
                  pinyin: { type: 'string' },
                  english: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: zh.sentenceMatch.all(entry).map((el: any) => {
        if (!el.pinyin) {
          el.pinyin = pinyin(entry, { keepRest: true })
        }

        return el
      })
    }
  })

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
      result: zh.sentenceQ({
        offset, limit
      }).all(`%${entry}%`),
      count: (zh.sentenceQCount.get(`%${entry}%`) || {}).count || 0,
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
    const s = zh.sentenceLevel.get(level || 60, levelMin || 1) || {} as any

    return {
      result: s.chinese,
      level: s.level
    }
  })

  next()
}

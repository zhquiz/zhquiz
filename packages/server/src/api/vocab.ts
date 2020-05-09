import { FastifyInstance } from 'fastify'
import { zh } from '../db/local'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/q', {
    schema: {
      tags: ['vocab'],
      summary: 'Query for a given vocab',
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
                required: ['simplified', 'pinyin', 'english'],
                properties: {
                  simplified: { type: 'string' },
                  traditional: { type: 'string' },
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
      result: zh.vocabQ({
        offset, limit
      }).all(`%${entry}%`, `%${entry}%`),
      count: (zh.vocabQCount.get(`%${entry}%`, `%${entry}%`) || {}).count || 0,
      offset,
      limit
    }
  })

  f.post('/match', {
    schema: {
      tags: ['vocab'],
      summary: 'Get translation for a given vocab',
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
              type: 'object',
              properties: {
                vocab: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['simplified', 'pinyin', 'english'],
                    properties: {
                      simplified: { type: 'string' },
                      traditional: { type: 'string' },
                      pinyin: { type: 'string' },
                      english: { type: 'string' }
                    }
                  }
                },
                sentences: {
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
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: {
        vocab: zh.vocabMatch.all(entry, entry),
        sentences: zh.sentenceQ({ offset: 0, limit: 10 }).all(`%${entry}%`)
      }
    }
  })

  f.post('/random', {
    schema: {
      tags: ['vocab'],
      summary: 'Randomize a vocab for a given level',
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

    const vs = Object.entries(zh.hsk)
      .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
      .filter(({ lv }) => level ? lv <= level : true)
      .filter(({ lv }) => level ? lv >= levelMin : true)
      .reduce((prev, { lv, vs }) => [...prev, ...vs.map(v => ({ v, lv }))], [] as {
        v: string
        lv: number
      }[])

    const v = vs[Math.floor(Math.random() * vs.length)] || {} as any

    return {
      result: v.v,
      level: v.lv
    }
  })

  f.post('/all', {
    schema: {
      tags: ['vocab'],
      summary: 'Get all leveled vocabs',
      response: {
        200: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }, async () => {
    return zh.hsk
  })

  next()
}

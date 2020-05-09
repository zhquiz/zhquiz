import { FastifyInstance } from 'fastify'
import { zh } from '../db/local'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/match', {
    schema: {
      tags: ['hanzi'],
      summary: 'Get data for a given Hanzi',
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
                sup: { type: 'string' },
                sub: { type: 'string' },
                var: { type: 'string' },
                pinyin: { type: 'string' },
                english: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: zh.hanziMatch.get(entry)
    }
  })

  f.post('/random', {
    schema: {
      tags: ['hanzi'],
      summary: 'Randomize a Hanzi for a given level',
      body: {
        type: 'object',
        properties: {
          levelMin: { type: 'integer' },
          level: { type: 'integer' }
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

    const hsMap = new Map<string, number>()

    Object.entries(zh.hsk)
      .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
      .filter(({ lv }) => level ? lv <= level : true)
      .filter(({ lv }) => levelMin ? lv >= levelMin : true)
      .map(({ lv, vs }) => {
        vs.map(v => {
          v.split('').map(h => {
            const hLevel = hsMap.get(h)
            if (!hLevel || hLevel > lv) {
              hsMap.set(h, lv)
            }
          })
        })
      })

    const hs = Array.from(hsMap)
    const [h, lv] = hs[Math.floor(Math.random() * hs.length)] || []

    return {
      result: h,
      level: lv
    }
  })

  next()
}

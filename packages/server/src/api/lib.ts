import { FastifyInstance } from 'fastify'
import jieba from 'nodejieba'
import pinyin from 'chinese-to-pinyin'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/jieba', {
    schema: {
      tags: ['lib'],
      summary: 'Cut chinese text into segments',
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
            result: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: jieba.cut(entry)
    }
  })

  f.post('/pinyin', {
    schema: {
      tags: ['lib'],
      summary: 'Generate pinyin from Chinese text',
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
            result: { type: 'string' }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: pinyin(entry, { keepRest: true })
    }
  })

  next()
}

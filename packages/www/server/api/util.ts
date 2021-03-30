import path from 'path'

import toPinyin from 'chinese-to-pinyin'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import Text2Speech from 'node-gtts'
import jieba from 'nodejieba'

jieba.load({
  userDict: path.join(__dirname, '../../assets/trad.dict.txt'),
})

const utilRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      q: S.string(),
    })

    const sResponse = S.shape({
      result: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/tokenize',
      {
        schema: {
          operationId: 'tokenize',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        return {
          result: jieba
            .cutForSearch(req.query.q)
            .filter((v) => /\p{sc=Han}/u.test(v))
            .filter((a, i, r) => r.indexOf(a) === i),
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/reading',
      {
        schema: {
          operationId: 'reading',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        return {
          result: await makeReading(req.query.q),
        }
      }
    )
  }

  {
    const sQuerystring = S.shape({
      q: S.string(),
    })

    f.get<{
      Querystring: typeof sQuerystring.type
    }>(
      '/speak',
      {
        schema: {
          operationId: 'speak',
          querystring: sQuerystring.valueOf(),
        },
      },
      (req, reply) => {
        const gtts = Text2Speech('zh')
        reply.send(gtts.stream(req.query.q))
      }
    )
  }
}

export default utilRouter

export async function makeReading(el: string) {
  return toPinyin(el, { keepRest: true, toneToNumber: true })
}

import path from 'path'

import toPinyin from 'chinese-to-pinyin'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import jieba from 'nodejieba'

import { lookupVocabulary } from './vocabulary'

jieba.load({
  userDict: path.join(__dirname, '../../trad.dict.txt'),
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
          result: jiebaCutForSearch(req.query.q),
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
          result: makeReading(req.query.q),
        }
      }
    )
  }

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
      '/english',
      {
        schema: {
          operationId: 'english',
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
          result: await makeEnglish(req.query.q, userId),
        }
      }
    )
  }
}

export default utilRouter

export function jiebaCutForSearch(el: string) {
  return jieba
    .cutForSearch(el)
    .filter((v) => /\p{sc=Han}/u.test(v))
    .filter((a, i, r) => r.indexOf(a) === i)
}

export function makeReading(el: string) {
  return toPinyin(el, { keepRest: true, toneToNumber: true })
}

export async function makeEnglish(el: string, userId: string) {
  const segs = (
    await Promise.all(
      jieba.cut(el).map((s) => lookupVocabulary(s, userId, true))
    )
  )
    .filter((v) => v.english && /\p{sc=Han}/u.test(v.entry))
    .map((v) => v!.english!.join(' / ').replace(new RegExp(v.entry, 'g'), ''))
    .filter((v) => v)

  return segs
}

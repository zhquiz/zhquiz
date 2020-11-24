import FSStorage from '@lokidb/fs-storage'
import FullTextSearch from '@lokidb/full-text-search'
import LokiDB, { Collection } from '@lokidb/loki'
import S from 'jsonschema-definer'
import jieba from 'nodejieba'
import XRegExp from 'xregexp'

FSStorage.register()
FullTextSearch.register()

let zh: LokiDB

export const sSentence = S.shape({
  chinese: S.string(),
  pinyin: S.string(),
  english: S.list(S.string()).minItems(1),
  frequency: S.number().optional(),
  level: S.integer().optional(),
  type: S.string().optional(),
  tag: S.list(S.string()).optional()
})

export let zhSentence: Collection<typeof sSentence.type>

const reHan1 = XRegExp('^\\p{Han}$')
const sHan1 = S.string().custom((s) => reHan1.test(s))

export const sToken = S.shape({
  entry: sHan1,
  sub: S.list(sHan1).optional(),
  sup: S.list(sHan1).optional(),
  variants: S.list(sHan1).optional(),
  frequency: S.number().optional(),
  hanziLevel: S.integer().optional(),
  vocabLevel: S.integer().optional(),
  tag: S.list(S.string()).optional(),
  pinyin: S.string().optional(),
  english: S.string().optional()
})

export let zhToken: Collection<typeof sToken.type>

export const sVocab = S.shape({
  simplified: S.string(),
  traditional: S.string().optional(),
  pinyin: S.string(),
  english: S.string(),
  frequency: S.number().optional()
})

export let zhVocab: Collection<typeof sVocab.type>

export async function initDB(filename: string) {
  zh = new LokiDB(filename)

  await zh.initializePersistence({
    adapter: new FSStorage(),
    autoload: true
  })

  zhSentence = zh.getCollection('sentence')
  if (!zhSentence) {
    zhSentence = zh.addCollection('sentence', {
      unique: ['chinese'],
      rangedIndexes: {
        frequency: {},
        level: {},
        type: {},
        tag: {}
      },
      fullTextSearch: [
        {
          field: 'chinese',
          analyzer: {
            tokenizer: (str) => jieba.cutForSearch(str)
          }
        },
        {
          field: 'english'
        }
      ]
    })
  }

  zhToken = zh.getCollection('token')
  if (!zhToken) {
    zhToken = zh.addCollection('token', {
      unique: ['entry'],
      rangedIndexes: {
        sub: {},
        sup: {},
        variants: {},
        frequency: {},
        hanziLevel: {},
        vocabLevel: {},
        tag: {}
      }
    })
  }

  zhVocab = zh.getCollection('vocab')
  if (!zhVocab) {
    zhVocab = zh.addCollection('vocab', {
      rangedIndexes: {
        simplified: {},
        traditional: {},
        frequency: {}
      }
    })
  }

  return zh
}

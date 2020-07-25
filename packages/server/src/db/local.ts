import fs from 'fs'

import yaml from 'js-yaml'
import S, { BaseSchema } from 'jsonschema-definer'
import Loki, { Collection } from 'lokijs'
import XRegExp from 'xregexp'

export const hsk = yaml.safeLoad(
  fs.readFileSync('assets/hsk.yaml', 'utf8')
) as Record<string, string[]>

export let zh: Loki

export const sSentence = S.shape({
  chinese: S.string(),
  pinyin: S.string().optional(),
  english: S.string(),
  frequency: S.number().optional(),
  level: S.integer().optional(),
  type: S.string().optional(),
})

export let zhSentence: Collection<typeof sSentence.type>

const reHan1 = XRegExp('^\\p{Han}$')

export const sToken = S.shape({
  entry: S.string().custom((s) => reHan1.test(s)),
  sub: S.string().optional(),
  sup: S.string().optional(),
  variants: S.string().optional(),
  frequency: S.number().optional(),
  level: S.integer().optional(),
  tag: S.list(S.string()).optional(),
  pinyin: S.string().optional(),
  english: S.string().optional(),
})

export let zhToken: Collection<typeof sToken.type>

export const sVocab = S.shape({
  simplified: S.string(),
  traditional: S.string().optional(),
  pinyin: S.string().optional(),
  english: S.string(),
  frequency: S.number().optional(),
})

export let zhVocab: Collection<typeof sVocab.type>

export async function zhInit(filename = 'assets/zh.loki') {
  return new Promise((resolve) => {
    zh = new Loki(filename, {
      autoload: true,
      autoloadCallback: async () => {
        zhSentence = zh.getCollection('sentence')
        if (!zhSentence) {
          zhSentence = zh.addCollection('sentence', {
            unique: [],
          })
        }

        zhToken = zh.getCollection('token')
        if (!zhToken) {
          zhToken = zh.addCollection('token', {
            unique: ['entry'],
          })
        }

        zhVocab = zh.getCollection('vocab')
        if (!zhVocab) {
          zhVocab = zh.addCollection('vocab', {
            unique: [],
          })
        }

        resolve()
      },
    })
  })
}

export function ensureSchema<T extends BaseSchema>(
  schema: T,
  data: T['type']
): T['type'] {
  const [, err] = schema.validate(data)
  if (err) {
    throw new Error((err[0] || {}).message)
  }

  return data as any
}

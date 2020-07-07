import fs from 'fs'

import yaml from 'js-yaml'
import Loki, { Collection } from 'lokijs'
import * as z from 'zod'

export const hsk = yaml.safeLoad(
  fs.readFileSync('assets/hsk.yaml', 'utf8')
) as Record<string, string[]>

export let zh: Loki

export const zSentence = z.object({
  chinese: z.string(),
  pinyin: z.string().optional(),
  english: z.string().optional(),
  frequency: z.number().optional(),
  level: z.number().optional(),
})

export let zhSentence: Collection<z.infer<typeof zSentence>>

const zDistinctString = z
  .string()
  .refine((s) => s && new Set(s).size === s.length)

export const zToken = z.object({
  entry: z.string(),
  sub: zDistinctString.optional(),
  sup: zDistinctString.optional(),
  variants: zDistinctString.optional(),
  frequency: z.number().optional(),
  level: z.number().optional(),
  tag: z.array(z.string()).optional(),
  pinyin: z.string().optional(),
  english: z.string().optional(),
})

export let zhToken: Collection<z.infer<typeof zToken>>

export const zVocab = z.object({
  simplified: z.string(),
  traditional: z.string().optional(),
  pinyin: z.string().optional(),
  english: z.string(),
})

export let zhVocab: Collection<z.infer<typeof zVocab>>

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

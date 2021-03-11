import shuffle from 'array-shuffle'
import toPinyin from 'chinese-to-pinyin'
import Loki from 'lokijs'

import { api } from './api'

export const zh = new Loki('zhlevel', {
  autoload: true
})

export interface ISentence {
  chinese: string;
  pinyin: string;
  english: string;
}

export const zhSentence = zh.addCollection<ISentence>('sentence', {
  indices: ['chinese'],
  unique: ['chinese']
})

const findSentenceQueue = new Map<string, ISentence[]>()

export function findSentenceSync (q: string, generate: number) {
  let prev = findSentenceQueue.get(q)
  if (prev) {
    return prev.slice(0, generate)
  }

  prev = shuffle(
    zhSentence.find({
      chinese: { $regex: new RegExp(q.replace(/[^\p{sc=Han}]/gu, '.*')) }
    })
  )
  findSentenceQueue.set(q, prev)

  return prev.slice(0, generate)
}

export async function findSentence (
  q: string,
  generate: number
): Promise<
  | {
      chinese: string;
      pinyin: string;
      english: string;
    }[]
  | null
> {
  const prev = findSentenceQueue.get(q)

  if (prev) {
    if (prev.length >= generate) {
      return prev.slice(0, generate)
    }

    return null
  }
  findSentenceQueue.set(q, [])

  const r = await api
    .get<{
      result: {
        chinese: string;
        english: string;
      }[];
    }>('/api/sentence/q', {
      params: {
        q,
        generate,
        select: 'chinese,english'
      }
    })
    .then((r) => r.data)

  let sentences = r.result.map((r) => ({
    chinese: r.chinese,
    pinyin: toPinyin(r.chinese, { keepRest: true, toneToNumber: true }),
    english: r.english.split('\x1f')[0]
  }))

  const oldSentence = new Set(
    zhSentence
      .find({ chinese: { $in: sentences.map((s) => s.chinese) } })
      .map((s) => s.chinese)
  )

  sentences = sentences.filter((s) => {
    return !oldSentence.has(s.chinese)
  })

  if (sentences.length) {
    zhSentence.insert(sentences)

    findSentenceQueue.delete(q)
    return findSentenceSync(q, generate)
  }

  return null
}

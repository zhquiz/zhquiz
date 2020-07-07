import sqlite3 from 'better-sqlite3'
import { runes } from 'runes2'

import {
  zh,
  zhInit,
  zhSentence,
  zhToken,
  zhVocab,
  zSentence,
  zToken,
  zVocab,
} from '../src/db/local'

async function main() {
  require('log-buffer')

  const db = sqlite3('assets/zh.db', { readonly: true })

  const olRegex = /^\s*\d+\.\s*/g
  const cleanOl = (s?: string) => {
    if (s && olRegex.test(s)) {
      return s.replace(olRegex, '')
    }
    return s || undefined
  }

  const addSpaceToSlash = (s = '') => {
    s = s || ''
    const indices = indicesOf(s, '/')
    if (indices.length > 0) {
      indices.map((c, i) => {
        c += i * 2
        s = s.substr(0, c) + ' / ' + s.substr(c + 1)
      })
    }

    return s || undefined
  }

  await zhInit()
  db.prepare(
    /* sql */ `
  SELECT chinese, pinyin, english, frequency, [level] FROM sentence
  `
  )
    .all()
    .map(({ chinese, pinyin, english, frequency, level }) => {
      zhSentence.insertOne(
        zSentence.parse({
          chinese: cleanOl(chinese),
          pinyin: pinyin || undefined,
          english: cleanOl(english),
          frequency: frequency || undefined,
          level: level || undefined,
        })
      )
    })

  db.prepare(
    /* sql */ `
  SELECT [entry], sub, sup, [var] variants, frequency, hlevel [level], tag, pinyin, english
  FROM token
  `
  )
    .all()
    .map(
      ({
        entry,
        sub,
        sup,
        variants,
        frequency,
        level,
        tag,
        pinyin,
        english,
      }) => {
        if (runes(entry).length === 1) {
          zhToken.insertOne(
            zToken.parse({
              entry,
              sub: sub || undefined,
              sup: sup || undefined,
              variants: variants || undefined,
              frequency: frequency || undefined,
              level: level || undefined,
              tag: tag ? tag.split(' ') : undefined,
              pinyin: pinyin || undefined,
              english: addSpaceToSlash(english),
            })
          )
        } else if (entry.length < 5) {
          console.log(entry, runes(entry), entry.length)
        }
      }
    )

  db.prepare(
    /* sql */ `
  SELECT simplified, traditional, v.pinyin pinyin, v.english english, frequency
  FROM vocab v
  LEFT JOIN token t ON simplified = [entry]
  `
  )
    .all()
    .map(({ simplified, traditional, pinyin, english, frequency }) => {
      zhVocab.insertOne(
        zVocab.parse({
          simplified,
          traditional: traditional || undefined,
          pinyin: pinyin || undefined,
          english: addSpaceToSlash(english),
          frequency: frequency || undefined,
        })
      )
    })

  zh.save(() => {
    zh.close()
  })

  db.close()
}

function notSpace(c: string) {
  return c && c !== ' '
}

function indicesOf(str: string, c: string) {
  const indices: number[] = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === c && notSpace(str[i - 1]) && notSpace(str[i + 1])) {
      indices.push(i)
    }
  }

  return indices
}

if (require.main === module) {
  main().catch(console.error)
}

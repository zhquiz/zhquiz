import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import makePinyin from 'chinese-to-pinyin'
import XRegExp from 'xregexp'

import {
  ensureSchema,
  sSentence,
  sToken,
  sVocab,
  zh,
  zhInit,
  zhSentence,
  zhToken,
  zhVocab,
} from '@/db/local'

async function main() {
  // require('log-buffer')
  const reHan1 = XRegExp('^\\p{Han}$')
  const reHan = XRegExp('\\p{Han}', 'g')

  const db = sqlite3('assets/zh.db', { readonly: true })
  const simpChars = new Set(
    fs.readFileSync('assets/hsk.yaml', 'utf8').match(reHan)
  )
  // console.log(simpChars)

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
        ensureSchema(sSentence, {
          chinese: cleanOl(chinese)!,
          pinyin: pinyin || makePinyin(chinese, { keepRest: true }),
          english: cleanOl(english)!,
          frequency: frequency || undefined,
          level: level || undefined,
          type:
            (Array.from<string>(chinese.match(reHan)).every((c) =>
              simpChars.has(c)
            )
              ? 'simplified'
              : 'traditional') + (/a-z/i.test(chinese) ? '-english' : ''),
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
        if (reHan1.test(entry)) {
          zhToken.insertOne(
            ensureSchema(sToken, {
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
        ensureSchema(sVocab, {
          simplified,
          traditional: traditional || undefined,
          pinyin: pinyin || undefined,
          english: addSpaceToSlash(english)!,
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
  main()
}

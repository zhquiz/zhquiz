import sqlite3 from 'better-sqlite3'

import {
  initZh,
  zh,
  zhSentence,
  zhToken,
  zhVocab,
  zSentence,
  zToken,
  zVocab,
} from '../src/db/local'

async function main() {
  const db = sqlite3('assets/zh.db', { readonly: true })

  await initZh()
  db.prepare(
    /* sql */ `
  SELECT chinese, pinyin, english, frequency, [level] FROM sentence
  `
  )
    .all()
    .map(({ chinese, pinyin, english, frequency, level }) => {
      zhSentence.insertOne(
        zSentence.parse({
          chinese,
          pinyin: pinyin || undefined,
          english: english || undefined,
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
            english: english || undefined,
          })
        )
      }
    )

  db.prepare(
    /* sql */ `
  SELECT simplified, traditional, pinyin, english
  FROM vocab
  `
  )
    .all()
    .map(({ simplified, traditional, pinyin, english }) => {
      zhVocab.insertOne(
        zVocab.parse({
          simplified,
          traditional: traditional || undefined,
          pinyin: pinyin || undefined,
          english,
        })
      )
    })

  zh.save(() => {
    zh.close()
  })

  db.close()
}

main()

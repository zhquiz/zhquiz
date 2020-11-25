import axios from 'axios'
/* eslint-disable no-unused-vars */
import sqlite3 from 'better-sqlite3'

import {
  initZh,
  sSentence,
  sVocab,
  zhSentence,
  zhVocab
} from '../src/db/chinese'

async function main() {
  const zh = await initZh('assets/zh.loki')

  async function addVocabs() {
    const cedict = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/cedict.db',
      { readonly: true }
    )

    const wordfreq: Record<string, number> = {}
    {
      const promises: (() => Promise<any>)[] = []

      const vs = cedict
        .prepare(
          /* sql */ `
        SELECT DISTINCT simplified
        FROM vocab
        `
        )
        .all()
        .map((c) => c.simplified)

      promises.push(
        ...vs.map((q) => () =>
          axios
            .get('http://localhost:9999', {
              params: {
                q
              }
            })
            .then((r) => r.data)
        )
      )

      const chunkSize = 1000
      for (let i = 0; i < promises.length; i += chunkSize) {
        await Promise.all(promises.slice(i, i + chunkSize).map((p) => p()))
      }
    }

    const vs = cedict
      .prepare(
        /* sql */ `
    SELECT simplified, traditional, pinyin, english
    FROM vocab
    `
      )
      .all()
      .map((v) =>
        sVocab.ensure({
          simplified: v.simplified,
          traditional: v.traditional || undefined,
          pinyin: v.pinyin,
          english: v.english.replace(/\//g, ' $& '),
          frequency: wordfreq[v.simplified]
        })
      )

    zhVocab.insert(vs)

    cedict.close()
  }

  await addVocabs()
  await zh.saveDatabase()

  async function addSentences() {
    const tatoeba = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/tatoeba.db'
    )

    const promises: (() => Promise<any>)[] = []

    for (const s of tatoeba
      .prepare(
        /* sql */ `
    SELECT
      s1.text                     chinese,
      group_concat(s2.text, '; ') english
    FROM sentence     s1
    JOIN translation  t   ON t.sentence_id = s1.id
    JOIN sentence     s2  ON t.translation_id = s2.id
    WHERE s1.lang = 'cmn' AND s2.lang = 'eng'
    GROUP BY chinese
    `
      )
      .iterate()) {
      promises.push(async () => {
        zhSentence.insert(
          sSentence.ensure({
            chinese: s.chinese,
            english: s.english,
            frequency: await axios
              .get('http://localhost:9999', {
                params: {
                  q: s.chinese
                }
              })
              .then((r) => r.data[s.chinese])
          })
        )
      })
    }

    const chunkSize = 1000
    for (let i = 0; i < promises.length; i += chunkSize) {
      await Promise.all(promises.slice(i, i + chunkSize).map((p) => p()))
    }
  }

  await addSentences()
  await zh.saveDatabase()

  await zh.close()
}

main().catch(console.error)

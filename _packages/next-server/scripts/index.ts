import axios from 'axios'
import sqlite3 from 'better-sqlite3'

import { IZhSentence, initZh } from '../src/db/chinese'

async function main() {
  const zh = initZh('assets/zh.db')
  const wordfreq = new Map<string, number>()

  // eslint-disable-next-line no-unused-vars
  async function addVocabs() {
    console.log('Adding vocab')

    const cedict = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/cedict.db',
      { readonly: true }
    )

    {
      const vs = cedict
        .prepare(
          /* sql */ `
        SELECT DISTINCT simplified
        FROM vocab
        `
        )
        .all()
        .map((c) => c.simplified)

      await axios
        .post('http://localhost:9999/freq', {
          entries: vs
        })
        .then(({ data: { result } }) =>
          (result as {
            entry: string
            frequency: number
          }[]).map(({ entry, frequency }) => {
            wordfreq.set(entry, frequency)
          })
        )
    }

    const vs = cedict
      .prepare(
        /* sql */ `
    SELECT simplified, traditional, pinyin, english
    FROM vocab
    `
      )
      .all()
      .map((v) => ({
        simplified: v.simplified,
        traditional: v.traditional || undefined,
        pinyin: v.pinyin,
        english: v.english.replace(/\//g, ' $& '),
        frequency: wordfreq.get(v.simplified)
      }))

    zh.cedictCreate(vs)
    cedict.close()

    console.log('Added vocab')
  }

  async function addSentences() {
    console.log('Adding sentences')

    const tatoeba = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/tatoeba.db'
    )

    const ss: IZhSentence[] = []

    const ssInsert = async (ssSub: IZhSentence[]) => {
      await axios
        .post('http://localhost:9999/freq', {
          entries: ssSub.map(({ chinese }) => chinese)
        })
        .then(({ data: { result } }) =>
          (result as {
            entry: string
            frequency: number
          }[]).map(({ entry, frequency }) => {
            wordfreq.set(entry, frequency)
          })
        )

      zh.sentenceCreateMany(
        ssSub.map((s) => ({
          ...s,
          pinyin: null,
          frequency: wordfreq.get(s.chinese)
        }))
      )
    }

    for (const s of tatoeba
      .prepare(
        /* sql */ `
    SELECT
      s1.id                       id,
      s1.text                     chinese,
      json_group_array(s2.text)   english
    FROM sentence     s1
    JOIN translation  t   ON t.sentence_id = s1.id
    JOIN sentence     s2  ON t.translation_id = s2.id
    WHERE s1.lang = 'cmn' AND s2.lang = 'eng'
    GROUP BY chinese
    `
      )
      .iterate()) {
      ss.push({
        id: s.id,
        chinese: s.chinese,
        english: JSON.parse(s.english)
      })

      if (ss.length > 500) {
        await ssInsert(ss.splice(0, 500))
      }
    }

    await ssInsert(ss)

    console.log('Added sentences')
  }

  await addSentences()
  await addVocabs()

  zh.db.close()
}

main().catch(console.error)

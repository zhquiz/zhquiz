import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import XRegExp from 'xregexp'

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

  // eslint-disable-next-line no-unused-vars
  async function addSentences() {
    console.log('Adding sentences')

    const tatoeba = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/tatoeba.db',
      { readonly: true }
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

  // eslint-disable-next-line no-unused-vars
  async function addHanzi() {
    console.log('Adding hanzi')
    zh.db.exec('PRAGMA foreign_keys=off')

    const rad = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/radical.db',
      { readonly: true }
    )

    const reHan = XRegExp('\\p{Han}', 'g')
    const hSet = new Set<string>(
      zh.db
        .prepare(
          /* sql */ `
    SELECT [entry] FROM token
    `
        )
        .all()
        .map(({ entry }) => entry)
    )

    const hFn = {
      arr: [] as string[],
      stmt: zh.db.prepare(/* sql */ `
      INSERT INTO token ([entry])
      VALUES (@entry)
      ON CONFLICT DO NOTHING
      `),
      tx: zh.db.transaction(() => {
        hFn.arr.splice(0, 1000).map((entry) => hFn.stmt.run({ entry }))
      }),
      check(h: string) {
        if (!hSet.has(h)) {
          if (!hSet.has(h)) {
            this.arr.push(h)
            hSet.add(h)

            if (this.arr.length > 1000) {
              this.tx()
            }
          }
        }
      }
    }

    const compStmt = (n: string) => /* sql */ `
    INSERT INTO token_${n} (parent, child)
    VALUES (@parent, @child)
    ON CONFLICT DO NOTHING
    `

    const comp = {
      sub: {
        arr: [] as { parent: string; child: string }[],
        stmt: zh.db.prepare(compStmt('sub')),
        tx: zh.db.transaction(() => {
          comp.sub.arr.splice(0, 1000).map((h) => comp.sub.stmt.run(h))
        }),
        check(it: { parent: string; child: string }) {
          this.arr.push(it)

          if (this.arr.length > 1000) {
            this.tx()
          }
        }
      },
      sup: {
        arr: [] as { parent: string; child: string }[],
        stmt: zh.db.prepare(compStmt('sup')),
        tx: zh.db.transaction(() => {
          comp.sup.arr.splice(0, 1000).map((h) => comp.sup.stmt.run(h))
        }),
        check(it: { parent: string; child: string }) {
          this.arr.push(it)

          if (this.arr.length > 1000) {
            this.tx()
          }
        }
      },
      var: {
        arr: [] as { parent: string; child: string }[],
        stmt: zh.db.prepare(compStmt('var')),
        tx: zh.db.transaction(() => {
          comp.var.arr.splice(0, 1000).map((h) => comp.var.stmt.run(h))
        }),
        check(it: { parent: string; child: string }) {
          this.arr.push(it)

          if (this.arr.length > 1000) {
            this.tx()
          }
        }
      }
    }

    for (const it of rad
      .prepare(
        /* sql */ `
    SELECT [entry], sub, sup, [var]
    FROM radical
    `
      )
      .iterate()) {
      hFn.check(it.entry)
      ;(((it.sub as string) || '').match(reHan) || []).map((t) => {
        hFn.check(t)
        comp.sub.check({ parent: it.entry, child: t })
      })
      ;(((it.sup as string) || '').match(reHan) || []).map((t) => {
        hFn.check(t)
        comp.sup.check({ parent: it.entry, child: t })
      })
      ;(((it.var as string) || '').match(reHan) || []).map((t) => {
        hFn.check(t)
        comp.var.check({ parent: it.entry, child: t })
      })
    }

    comp.sub.tx()
    comp.sup.tx()
    comp.var.tx()

    rad.close()

    const junda = sqlite3(
      '/mnt/c/Users/Pacharapol W/Dropbox/database/junda.db',
      { readonly: true }
    )

    for (const { character } of junda
      .prepare(
        /* sql */ `
    SELECT [character] FROM hanzi
    `
      )
      .iterate()) {
      hFn.check(character)
    }

    hFn.tx()

    const u = {
      arr: [] as {
        entry: string
        frequency?: number
        pinyin?: string
        english?: string
      }[],
      stmt: zh.db.prepare(/* sql */ `
      UPDATE token
      SET
        frequency = @frequency,
        pinyin = @pinyin,
        english = @english
      WHERE [entry] = @entry
      `),
      tx: zh.db.transaction(() => {
        u.arr.splice(0, 1000).map((u0) =>
          u.stmt.run({
            entry: u0.entry,
            frequency: u0.frequency || undefined,
            pinyin: u0.pinyin ? u0.pinyin.replace(/\//g, ' $& ') : undefined,
            english: u0.english ? u0.english.replace(/\//g, ' $& ') : undefined
          })
        )
      }),
      check(it: {
        entry: string
        frequency?: number
        pinyin?: string
        english?: string
      }) {
        this.arr.push(it)
        if (this.arr.length > 1000) {
          this.tx()
        }
      }
    }

    for (const it of junda
      .prepare(
        /* sql */ `
    SELECT [character] [entry], raw_freq frequency, pinyin, english FROM hanzi
    `
      )
      .iterate()) {
      u.check(it)
    }

    u.tx()
    zh.db.exec('PRAGMA foreign_keys=on')

    junda.close()

    console.log('Added hanzi')
  }

  // await addSentences()
  // await addVocabs()
  await addHanzi()

  zh.db.close()
}

main().catch(console.error)

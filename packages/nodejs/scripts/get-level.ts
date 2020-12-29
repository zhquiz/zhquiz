import * as z from 'zod'

import axios from 'axios'
import fs from 'fs'
import runes from 'runes2'
import sqlite from 'better-sqlite3'
import yaml from 'js-yaml'

interface IEntry {
  frequency?: number
  hLevel?: number
  vLevel?: number
}

async function main() {
  const itMap = new Map<string, IEntry>()

  const zHanzi = z.record(
    z
      .object({
        hanzi: z.string()
      })
      .nonstrict()
  )

  Object.entries(
    zHanzi.parse(
      yaml.safeLoad(fs.readFileSync('../../assets/hanzi.yaml', 'utf-8'))
    )
  ).map(([lvString, { hanzi }]) => {
    const lv = parseInt(lvString)

    runes(hanzi).map((h) => {
      itMap.set(h, {
        hLevel: lv
      })
    })
  })

  const zVocab = z.record(
    z
      .object({
        vocab: z.array(z.string())
      })
      .nonstrict()
  )

  Object.entries(
    zVocab.parse(
      yaml.safeLoad(fs.readFileSync('../../assets/vocab.yaml', 'utf-8'))
    )
  ).map(([lvString, { vocab }]) => {
    const lv = parseInt(lvString)

    vocab.map((h) => {
      h = h.replace(/（.+?）/, '')

      const it: IEntry = itMap.get(h) || {}

      if (!it.vLevel || lv > it.vLevel) {
        it.vLevel = lv
        itMap.set(h, it)
      }
    })
  })

  const db = sqlite('../../submodules/server/assets/zh.db')

  const { data } = await axios.post<Record<string, number>>(
    'http://localhost:8000/wordfreq',
    Array.from(itMap.keys())
  )

  Object.entries(data).map(([k, frequency]) => {
    const it: IEntry = itMap.get(k) || {}
    it.frequency = frequency
    itMap.set(k, it)
  })

  const stmt = db.prepare(/* sql */ `
  INSERT INTO token ([entry], frequency, hanzi_level, vocab_level)
  VALUES (@entry, @frequency, @hLevel, @vLevel)
  ON CONFLICT ([entry]) DO UPDATE
  SET
    frequency = @frequency, hanzi_level = @hLevel, vocab_level = @vLevel
  `)

  db.transaction(() => {
    for (const [entry, d] of itMap) {
      stmt.run({
        entry,
        frequency: d.frequency,
        hLevel: d.hLevel,
        vLevel: d.vLevel
      })
    }
  })()

  db.close()
}

if (require.main === module) {
  main()
}

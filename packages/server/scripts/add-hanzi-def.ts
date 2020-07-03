import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import csv from 'neat-csv'

async function main() {
  const db = sqlite3('assets/zh.db')
  const stmt = db.prepare(/* sql */ `
  UPDATE token
  SET pinyin = ?, english = ?
  WHERE [entry] = ?
  `)

  const data = await csv(
    fs.createReadStream(
      '/Users/patarapolw/Downloads/CharFreq-Combined.csv',
      'utf8'
    ),
    {
      headers: ['id', 'hanzi', 'count', 'percentile', 'pinyin', 'english'],
    }
  )
  data.map((d) => {
    stmt.run(d.pinyin || null, d.english || null, d.hanzi)
  })

  db.close()
}

main()

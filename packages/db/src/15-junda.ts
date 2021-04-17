import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool, dir = '/app/assets') {
  process.chdir(dir)

  const s3 = sqlite3('./junda.db', {
    readonly: true
  })

  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT "id", "character", "raw_freq" "frequency", "pinyin", "english"
    FROM hanzi
    `
      )
      .all()
      .map((p) => {
        return sql`('character', 'junda', ${p.id}, ${[
          p.character
        ]}, ${p.pinyin.split('/').filter((s: string) => s)}, ${p.english
          .split('/')
          .filter((s: string) => s)}, ${p.frequency})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO dict.entries ("type", "source", "originalId", "entry", "pinyin", "english", "frequency")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  s3.close()
}

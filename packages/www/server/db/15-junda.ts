import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool) {
  const s3 = sqlite3('./junda.db', {
    readonly: true,
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
        return sql`(${p.id}, ${p.character}, ${p.frequency}, ${p.pinyin
          .split('/')
          .filter((s: string) => s)}, ${p.english
          .split('/')
          .filter((s: string) => s)})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO dict.junda ("id", "character", "frequency", "pinyin", "english")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  s3.close()

  console.log('Updating materialized view')
  await db.query(sql`
    REFRESH MATERIALIZED VIEW "character";
  `)
}

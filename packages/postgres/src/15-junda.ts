import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'
import { Frequency } from '@patarapolw/zhlevel'

export async function populate(db: ConnectionPool, dir = '/app/assets') {
  process.chdir(dir)

  const s3 = sqlite3('./junda.db', {
    readonly: true
  })

  const f = new Frequency()

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
        return sql`('character', ${['junda']}, ${[p.character]}, ${p.pinyin
          .split('/')
          .filter((s: string) => s)}, ${p.english
          .split('/')
          .filter((s: string) => s)}, ${f.cFreq(p.character)})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO "entry" ("type", "tag", "entry", "reading", "translation", "frequency")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
        ON CONFLICT (("entry"[1]), "type", "userId") DO UPDATE SET
          "frequency" = EXCLUDED."frequency",
          "level" = EXCLUDED."level"
      `)
    }
  })

  s3.close()
  f.close()
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await populate(db, './assets')
  })()
}

import fs from 'fs'

import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool) {
  if (!fs.existsSync('./zhquiz.db')) {
    return
  }

  const s3 = sqlite3('./zhquiz.db', {
    readonly: true,
  })

  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT "chinese", "english"
    FROM "sentence"
    `
      )
      .all()
      .map((p) => {
        return sql`(${p.chinese}, ${p.english})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO "online".jukuu ("chinese", "english")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
        ON CONFLICT ("chinese") DO NOTHING
      `)
    }
  })

  s3.close()
}

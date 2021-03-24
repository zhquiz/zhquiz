import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool) {
  const s3 = sqlite3('./cedict.db', {
    readonly: true,
  })

  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT "simplified", "traditional", "reading", "english", "frequency"
    FROM cedict
    `
      )
      .all()
      .map((p) => {
        return sql`(${p.simplified}, ${p.traditional}, ${
          p.reading
        }, ${JSON.parse(p.english)}, ${p.frequency})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO dict.cedict ("simplified", "traditional", "reading", "english", "frequency")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  s3.close()
}

import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool, dir = '/app/assets') {
  process.chdir(dir)

  const s3 = sqlite3('./zhlevel.db', {
    readonly: true
  })

  await db.tx(async (db) => {
    const batchSize = 5000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT
      "entry",
      hLevel,
      vLevel
    FROM zhlevel
    `
      )
      .all()
      .map((p) => {
        return sql`(${p.entry.replace(/……/g, '...')}, ${p.hLevel}, ${p.vLevel})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO dict.zhlevel ("entry", "hLevel", "vLevel")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  s3.close()
}

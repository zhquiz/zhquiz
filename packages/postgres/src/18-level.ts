import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'
import { Frequency, makePinyin } from '@patarapolw/zhlevel'

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
      hLevel
    FROM zhlevel
    WHERE hLevel IS NOT NULL
    `
      )
      .all()
      .map((p) => {
        return sql`('character', ${[p.entry]}, ${[makePinyin(p.entry)]}, ${
          p.hLevel
        }, ${['zhlevel']}, ${f.cFreq(p.entry)})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO "entry" ("type", "entry", "reading", "level", "tag", "frequency")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
        ON CONFLICT DO UPDATE SET
          "level" = EXCLUDED."level",
          "tag" = EXCLUDED."tag"||"tag"
      `)
    }
  })

  const f = new Frequency()

  await db.tx(async (db) => {
    const batchSize = 5000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT
      "entry",
      vLevel
    FROM zhlevel
    WHERE vLevel IS NOT NULL
    `
      )
      .all()
      .map((p) => {
        const entry = p.entry.replace(/……/g, '...')
        return sql`('vocabulary', ${[entry]},  ${[makePinyin(entry)]},${
          p.vLevel
        }, ${['zhlevel']}, ${f.vFreq(entry)})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO "entry" ("type", "entry", "reading", "level", "tag", "frequency")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
        ON CONFLICT DO UPDATE SET
          "level" = EXCLUDED."level",
          "tag" = EXCLUDED."tag"||"tag"
      `)
    }
  })

  s3.close()
  f.close()
}

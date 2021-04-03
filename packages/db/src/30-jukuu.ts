import fs from 'fs'

import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool, dir = '/app/assets') {
  process.chdir(dir)

  if (!fs.existsSync('./jukuu.db')) {
    return
  }

  const s3 = sqlite3('./jukuu.db', {
    readonly: true
  })

  await db.tx(async (db) => {
    const batchSize = 10000

    {
      const lots = s3
        .prepare(
          /* sql */ `
      SELECT "chinese", "english"
      FROM jukuu
      `
        )
        .all()

      for (let i = 0; i < lots.length; i += batchSize) {
        console.log(i)
        await db.query(sql`
        INSERT INTO online.jukuu ("chinese", "english")
        VALUES ${sql.join(
          lots
            .slice(i, i + batchSize)
            .map((r) => sql`(${r.chinese}, ${r.english})`),
          ','
        )}
        ON CONFLICT DO NOTHING
        `)
      }
    }

    {
      const lots = s3
        .prepare(
          /* sql */ `
      SELECT "q", "count", "createdAt", "updatedAt"
      FROM jukuu_history
      `
        )
        .all()

      for (let i = 0; i < lots.length; i += batchSize) {
        console.log(i)
        await db.query(sql`
        INSERT INTO online.jukuu_history ("q", "count", "createdAt", "updatedAt")
        VALUES ${sql.join(
          lots
            .slice(i, i + batchSize)
            .map(
              (r) =>
                sql`(${r.q}, ${r.count}, ${new Date(r.createdAt)}, ${new Date(
                  r.updatedAt
                )})`
            ),
          ','
        )}
        ON CONFLICT DO NOTHING
        `)
      }
    }
  })

  s3.close()

  console.log('Updating materialized view')
  await db
    .query(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY sentence`)
    .then(() =>
      Promise.all([
        db.query(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY "level"`),
        db.query(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY dict.cedict_view`)
      ])
    )
}

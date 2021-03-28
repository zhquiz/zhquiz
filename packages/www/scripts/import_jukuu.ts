import sql from '@databases/sql'
import { db } from '~/server/shared'
import sqlite3 from 'better-sqlite3'

async function main() {
  const s3 = sqlite3('./db/assets/jukuu.db', { readonly: true })

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
  await db.dispose()
}

if (require.main === module) {
  main()
}

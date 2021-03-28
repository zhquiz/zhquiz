import sql from '@databases/sql'
import { db } from '~/server/shared'
import sqlite3 from 'better-sqlite3'

async function main() {
  const s3 = sqlite3('./db/assets/jukuu.db')

  s3.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS jukuu (
    "chinese"     TEXT NOT NULL PRIMARY KEY,
    "english"     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jukuu_history (
    "q"           TEXT NOT NULL PRIMARY KEY,
    "count"       INT NOT NULL,
    "createdAt"   TIMESTAMP NOT NULL,
    "updatedAt"   TIMESTAMP NOT NULL
  );
  `)

  {
    const rs = await db.query(sql`
    SELECT "chinese", "english" FROM online.jukuu
    `)

    const stmt = s3.prepare(/* sql */ `
    INSERT INTO jukuu ("chinese", "english")
    VALUES (@chinese, @english)
    ON CONFLICT DO NOTHING
    `)

    s3.transaction(() => {
      rs.map((r) => stmt.run(r))
    })()
  }

  {
    const rs = await db.query(sql`
    SELECT "q", "count", "createdAt"::text, "updatedAt"::text FROM online.jukuu_history
    `)

    const stmt = s3.prepare(/* sql */ `
    INSERT INTO jukuu_history ("q", "count", "createdAt", "updatedAt")
    VALUES (@q, @count, @createdAt, @updatedAt)
    ON CONFLICT DO NOTHING
    `)

    s3.transaction(() => {
      rs.map((r) => stmt.run(r))
    })()
  }

  s3.close()
  await db.dispose()
}

if (require.main === module) {
  main()
}

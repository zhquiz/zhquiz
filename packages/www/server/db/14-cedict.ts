import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'

import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool) {
  const s3 = sqlite3('./cedict.db')

  s3.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS "cedict" (
    "simplified"    TEXT NOT NULL,
    "traditional"   TEXT CHECK ("simplified" != "traditional"),
    "reading"      TEXT,
    "english"       JSON
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_u_cedict ON "cedict" ("simplified", "traditional", "reading");
  `)

  try {
    console.log('Downloading the latest CEDICT.')

    const zipName = './cedict_1_0_ts_utf-8_mdbg.txt.gz'
    const urlString =
      'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz'
    if (fs.existsSync(zipName)) {
      fs.unlinkSync(zipName)
    }
    const f = fs.createWriteStream(zipName)
    https.get(urlString, (res) => {
      res.pipe(f)
    })

    await new Promise((resolve, reject) => {
      f.once('error', reject).once('finish', resolve)
    })

    execSync(`gzip -d ${zipName}`)

    const f2 = fs.createReadStream('./cedict_1_0_ts_utf-8_mdbg.txt')
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "cedict" ("simplified", "traditional", "reading", "english")
    VALUES (@simplified, @traditional, @reading, @english)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const m = /^(\p{sc=Han}+) (\p{sc=Han}+) \[([^\]]+)\] \/(.+)\/$/u.exec(
          ln
        )

        if (m) {
          stmt.run({
            simplified: m[2],
            traditional: m[2] === m[1] ? null : m[1],
            reading: m[3],
            english: JSON.stringify(m[4].split('/')),
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const m = /^(\p{sc=Han}+) (\p{sc=Han}+) \[([^\]]+)\] \/(.+)\/$/u.exec(
          line
        )

        if (m) {
          stmt.run({
            simplified: m[2],
            traditional: m[2] === m[1] ? null : m[1],
            reading: m[3],
            english: JSON.stringify(m[4].split('/')),
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  } catch (e) {
    console.error(e)
  }

  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT "simplified", "traditional", "reading", "english"
    FROM cedict
    `
      )
      .all()
      .map((p) => {
        return sql`(${p.simplified}, ${p.traditional}, ${
          p.reading
        }, ${JSON.parse(p.english)})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO dict.cedict ("simplified", "traditional", "reading", "english")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
        ON CONFLICT DO NOTHING
      `)
    }
  })

  s3.close()

  if (!process.cwd().startsWith('/app')) {
    console.log('Updating materialized view')
    await db
      .query(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY sentence`)
      .then(() =>
        Promise.all([
          db.query(
            sql`REFRESH MATERIALIZED VIEW CONCURRENTLY "sentence_isTrad"`
          ),
          db.query(
            sql`REFRESH MATERIALIZED VIEW CONCURRENTLY dict.cedict_view`
          ),
        ])
      )
  }
}

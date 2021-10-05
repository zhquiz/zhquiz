import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'
import os from 'os'
import path from 'path'

import axios, { AxiosResponse } from 'axios'
import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'
import { Level } from '@patarapolw/zhlevel'

export async function populate(
  db: ConnectionPool,
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cedict'))
) {
  process.chdir(dir)

  const s3 = sqlite3('./cedict.db')

  s3.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS "cedict" (
    "simplified"    TEXT NOT NULL,
    "traditional"   TEXT CHECK ("simplified" != "traditional"),
    "reading"       TEXT,
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
          ln.trim()
        )

        if (m) {
          stmt.run({
            simplified: m[2],
            traditional: m[2] === m[1] ? null : m[1],
            reading: m[3],
            english: JSON.stringify(m[4].split('/'))
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const m = /^(\p{sc=Han}+) (\p{sc=Han}+) \[([^\]]+)\] \/(.+)\/$/u.exec(
          line.trim()
        )

        if (m) {
          stmt.run({
            simplified: m[2],
            traditional: m[2] === m[1] ? null : m[1],
            reading: m[3],
            english: JSON.stringify(m[4].split('/'))
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  } catch (e) {
    console.error(e)
  }

  const lv = new Level()

  await db.tx(async (db) => {
    const batchSize = 1000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT
      "simplified",
      json_group_array("traditional") "alt",
      json_group_array("reading") "reading",
      json_group_array(json("english")) "english"
    FROM cedict
    GROUP BY "simplified"
    `
      )
      .all()

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      const sublot: Record<string, typeof lots[0]> = {}
      lots.slice(i, i + batchSize).map((p) => (sublot[p.simplified] = p))

      const { data: fMap } = await axios.post<
        any,
        AxiosResponse<Record<string, number>>
      >('https://cdn.zhquiz.cc/api/wordfreq?lang=zh', {
        q: Object.keys(sublot)
      })
      for (const [k, f] of Object.entries(fMap)) {
        sublot[k].frequency = f
      }

      await db.query(sql`
        INSERT INTO "entry" ("type", "tag", "entry", "reading", "translation", "frequency", "level", "hLevel")
        VALUES ${sql.join(
          Object.values(sublot).map((p) => {
            const entry: string[] = [
              p.simplified,
              ...(JSON.parse(p.alt) as string[]).filter((it) => it)
            ].filter((a, i, r) => r.indexOf(a) === i)

            const english = (JSON.parse(p.english) as string[][])
              .flat()
              .filter((a, i, r) => r.indexOf(a) === i)

            return sql`('vocabulary', ${['cedict']}, ${entry}, ${JSON.parse(
              p.reading
            )}, ${english}, ${p.frequency}, ${lv.vLevel(
              p.simplified
            )}, ${lv.hLevel(p.simplified)})`
          }),
          ','
        )}
        ON CONFLICT (("entry"[1]), "type", "userId") DO UPDATE SET
          "frequency"   = EXCLUDED."frequency",
          "reading"     = array_distinct("entry"."reading"||EXCLUDED."reading"),
          "translation" = array_distinct("entry"."translation"||EXCLUDED."translation"),
          "tag"         = array_distinct("entry"."tag"||EXCLUDED."tag")
      `)
    }
  })

  s3.close()
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await populate(db)
  })()
}

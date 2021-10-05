import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'
import os from 'os'
import path from 'path'

import axios, { AxiosResponse } from 'axios'
import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'
import { makePinyin, Level } from '@patarapolw/zhlevel'

export async function populate(
  db: ConnectionPool,
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tatoeba'))
) {
  process.chdir(dir)

  const s3 = sqlite3('./tatoeba.db')

  s3.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS "sentence" (
    "id"      INT NOT NULL PRIMARY KEY,
    "lang"    TEXT NOT NULL,
    "text"    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "link" (
    "id1"     INT NOT NULL,
    "id2"     INT NOT NULL,
    PRIMARY KEY ("id1", "id2")
  );
  `)

  try {
    console.log('Downloading the latest Tatoeba CMN.')

    const zipName = './cmn_sentences.tsv.bz2'
    const urlString =
      'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2'
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

    execSync(`bzip2 -d ${zipName}`)

    const f2 = fs.createReadStream('./cmn_sentences.tsv')
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "text")
    VALUES (@id, @lang, @text)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const rs = ln.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const rs = line.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  } catch (e) {
    console.error(e)
  }

  try {
    console.log('Downloading the latest Tatoeba ENG.')

    const zipName = './eng_sentences.tsv.bz2'
    const urlString =
      'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2'
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

    execSync(`bzip2 -d ${zipName}`)

    const f2 = fs.createReadStream('./eng_sentences.tsv')
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "text")
    VALUES (@id, @lang, @text)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const rs = ln.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const rs = line.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  } catch (e) {
    console.error(e)
  }

  try {
    console.log('Downloading the latest Tatoeba Links.')

    const zipName = './links.tar.bz2'
    const urlString = 'https://downloads.tatoeba.org/exports/links.tar.bz2'
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

    execSync(`tar -xf ${zipName}`)

    const f2 = fs.createReadStream('./links.csv')

    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "link" ("id1", "id2")
    VALUES (@id1, @id2)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const rs = ln.split('\t')
        if (rs.length === 2) {
          stmt.run({
            id1: parseInt(rs[0]),
            id2: parseInt(rs[1])
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const rs = line.split('\t')
        if (rs.length === 2) {
          stmt.run({
            id1: parseInt(rs[0]),
            id2: parseInt(rs[1])
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
    const batchSize = 5000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT
      s1.id       id,
      s1.text     cmn,
      json_group_array(s2.text) eng
    FROM sentence s1
    JOIN link t       ON t.id1 = s1.id
    JOIN sentence s2  ON t.id2 = s2.id
    WHERE s1.lang = 'cmn' AND s2.lang = 'eng'
    GROUP BY s1.id, s1.text
    `
      )
      .all()

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      const sublot: Record<string, typeof lots[0]> = {}
      lots.slice(i, i + batchSize).map((p) => (sublot[p.cmn] = p))

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
        INSERT INTO "entry" ("type", "entry", "reading", "translation", "tag", "frequency", "level", "hLevel")
        VALUES ${sql.join(
          Object.values(sublot).map((p) => {
            return sql`('sentence', ${[p.cmn]}, ${[
              makePinyin(p.cmn)
            ]}, ${JSON.parse(p.eng)}, ${['tatoeba']}, ${
              p.frequency
            }, ${lv.vLevel(p.cmn)}, ${lv.hLevel(p.cmn)})`
          }),
          ','
        )}
        ON CONFLICT (("entry"[1]), "type", "userId") DO UPDATE SET
          "frequency"   = EXCLUDED."frequency",
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

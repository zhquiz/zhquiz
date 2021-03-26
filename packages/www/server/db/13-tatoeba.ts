import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'

import { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool) {
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

  const hasCMN = s3
    .prepare(
      /* sql */ `
  SELECT 1 FROM "sentence" WHERE "lang" = 'cmn'
  `
    )
    .get()
  if (!hasCMN) {
    console.log('CMN not found. Downloading Tatoeba CMN.')

    const f = fs.createWriteStream('./cmn_sentences.tsv.bz2')
    https.get(
      'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2',
      (res) => {
        res.pipe(f)
      }
    )

    await new Promise((resolve, reject) => {
      f.once('error', reject).once('finish', resolve)
    })

    execSync(`bzip2 -d ./cmn_sentences.tsv.bz2`)

    const f2 = fs.createReadStream('./cmn_sentences.tsv')
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "text")
    VALUES (@id, @lang, @text)
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
            text: rs[2],
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
            text: rs[2],
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  }

  const hasENG = s3
    .prepare(
      /* sql */ `
  SELECT 1 FROM "sentence" WHERE "lang" = 'eng'
  `
    )
    .get()
  if (!hasENG) {
    console.log('ENG not found. Downloading Tatoeba ENG.')

    const f = fs.createWriteStream('./eng_sentences.tsv.bz2')
    https.get(
      'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2',
      (res) => {
        res.pipe(f)
      }
    )

    await new Promise((resolve, reject) => {
      f.once('error', reject).once('finish', resolve)
    })

    execSync(`bzip2 -d ./eng_sentences.tsv.bz2`)

    const f2 = fs.createReadStream('./eng_sentences.tsv')
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "text")
    VALUES (@id, @lang, @text)
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
            text: rs[2],
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
            text: rs[2],
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  }

  const hasLink = s3
    .prepare(
      /* sql */ `
  SELECT 1 FROM "link"
  `
    )
    .get()
  if (!hasLink) {
    console.log('Links not found. Downloading Tatoeba Links.')

    const f = fs.createWriteStream('./links.tar.bz2')
    https.get('https://downloads.tatoeba.org/exports/links.tar.bz2', (res) => {
      res.pipe(f)
    })

    await new Promise((resolve, reject) => {
      f.once('error', reject).once('finish', resolve)
    })

    execSync(`tar -xf ./links.tar.bz2`)

    const f2 = fs.createReadStream('./links.csv')

    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "link" ("id1", "id2")
    VALUES (@id1, @id2)
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
            id2: parseInt(rs[1]),
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
            id2: parseInt(rs[1]),
          })
        }

        resolve()
      })
    })

    s3.exec('COMMIT')
  }

  await db.tx(async (db) => {
    const batchSize = 5000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT
      s1.id       id,
      s1.text     eng,
      json_group_object(
        s2.lang,
        s2.text
      ) translation
    FROM sentence s1
    JOIN link t       ON t.id1 = s1.id
    JOIN sentence s2  ON t.id2 = s2.id
    WHERE s1.lang = 'eng' AND s2.lang = 'cmn'
    GROUP BY s1.id
    `
      )
      .all()
      .map((p) => {
        const tr = JSON.parse(p.translation)
        return sql`(${p.id}, ${tr.cmn || null}, ${p.eng})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO dict.tatoeba ("id", "cmn", "eng")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  s3.close()

  await db.query(sql`
    REFRESH MATERIALIZED VIEW dict.tatoeba_view;
  `)
}

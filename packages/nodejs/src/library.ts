import * as z from 'zod'

import fs from 'fs'
import sqlite from 'better-sqlite3'
import yaml from 'js-yaml'

async function main() {
  const zLib = z.array(
    z.object({
      title: z.string(),
      children: z.array(
        z.object({
          title: z.string(),
          entries: z.array(z.string())
        })
      )
    })
  )

  const db = sqlite('../../submodules/go-zhquiz/assets/zh.db')

  db.exec(/* sql */ `
  DROP TABLE library;
  CREATE TABLE library (
    title       TEXT NOT NULL UNIQUE,
    entries     TEXT
  );
  `)

  const stmt = db.prepare(/* sql */ `
  INSERT INTO library (title, entries) VALUES (@title, @entries)
  ON CONFLICT DO NOTHING
  `)

  db.transaction(() => {
    zLib
      .parse(yaml.load(fs.readFileSync('../../assets/library.yaml', 'utf-8')))
      .map(({ title: t1, children }) => {
        children.map(({ title: t2, entries }) => {
          stmt.run({
            title: `${t1} / ${t2}`,
            entries: `\x1f${entries.join('\x1f')}\x1f`
          })
        })
      })
  })()

  db.close()
}

if (require.main === module) {
  main()
}

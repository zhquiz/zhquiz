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

  const db = sqlite('../jar/app/src/main/resources/zh.db')

  db.exec(/* sql */ `
  DROP TABLE library;
  CREATE TABLE library (
    id            INTEGER PRIMARY KEY,
    title         TEXT NOT NULL UNIQUE,
    entries       JSON NOT NULL,
    [description] TEXT NOT NULL DEFAULT '',
    [type]        TEXT NOT NULL,
    [tag]         JSON NOT NULL
  );
  `)

  const stmt = db.prepare(/* sql */ `
  INSERT INTO library (title, entries, [type], tag) VALUES (@title, @entries, @type, @tag)
  ON CONFLICT DO NOTHING
  `)

  db.transaction(() => {
    zLib
      .parse(yaml.load(fs.readFileSync('../../assets/library.yaml', 'utf-8')))
      .map(({ title: t1, children }) => {
        children.map(({ title: t2, entries }) => {
          stmt.run({
            title: `${t1} / ${t2}`,
            entries: JSON.stringify(entries),
            type: 'vocabulary',
            tag: JSON.stringify([t1, t2])
          })
        })
      })
  })()

  db.close()
}

if (require.main === module) {
  main()
}

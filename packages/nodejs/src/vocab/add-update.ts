import * as z from 'zod'

import fs from 'fs'
import sqlite from 'better-sqlite3'
import yaml from 'js-yaml'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  // const zVocab = z.record(
  //   z.object({
  //     _meta: z.object({
  //       source: z.string()
  //     }),
  //     vocab: z.array(z.string())
  //   })
  // )

  // const stmt = db.prepare(/* sql */ `
  // UPDATE token
  // SET tag = @tag
  // WHERE [entry] = @entry
  // `)

  // db.transaction(() => {
  //   Object.values(
  //     zVocab.parse(
  //       yaml.safeLoad(fs.readFileSync('../../assets/vocab.yaml', 'utf-8'))
  //     )
  //   ).map(({ _meta: { source }, vocab }) => {
  //     vocab.map((v) => {
  //       stmt.run({
  //         tag: source,
  //         entry: v
  //       })
  //     })
  //   })
  // })()

  db.exec(/* sql */ `
  UPDATE vocab
  SET frequency = NULL
  WHERE english LIKE 'abbr. for %'
  `)

  // console.log(
  //   db
  //     .prepare(
  //       /* sql */ `
  // SELECT english FROM vocab WHERE english LIKE '%name%'
  // `
  //     )
  //     .all()
  // )

  db.close()
}

if (require.main === module) {
  main()
}

import * as z from 'zod'

import fs from 'fs'
import sqlite from 'better-sqlite3'
import yaml from 'js-yaml'

async function main() {
  const db = sqlite('../../submodules/go-zhquiz/assets/zh.db')

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
  WHERE pinyin < 'a'
  `)

  console.log(
    db
      .prepare(
        /* sql */ `
  SELECT english, frequency FROM vocab WHERE pinyin < 'a'
  `
      )
      .all()
  )

  db.close()
}

if (require.main === module) {
  main()
}

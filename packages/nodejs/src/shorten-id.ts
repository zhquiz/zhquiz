import { nanoid } from 'nanoid'
import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/go-zhquiz/data.db')

  const tableName = 'extra'

  // const idMap = new Map<string, string>()

  // db.prepare(
  //   /* sql */ `
  // SELECT id FROM ${tableName}
  // `
  // )
  //   .all()
  //   .map(({ id }) => {
  //     let newId = nanoid(6)
  //     while (idMap.has(newId)) {
  //       newId = nanoid(6)
  //     }

  //     idMap.set(newId, id)
  //   })

  // const stmt = db.prepare(/* sql */ `
  // UPDATE ${tableName} SET id = @newId WHERE id = @id
  // `)

  // const stmtQ = db.prepare(/* sql */ `
  // UPDATE ${tableName}_q SET id = @newId WHERE id = @id
  // `)

  // db.transaction(() => {
  //   for (const [newId, id] of idMap) {
  //     stmt.run({ newId, id })
  //     stmtQ.run({ newId, id })
  //   }
  // })()

  db.prepare(
    /* sql */ `
  DELETE FROM ${tableName}_q WHERE id NOT IN (
    SELECT id FROM ${tableName}
  )
  `
  ).run()

  db.close()
}

if (require.main === module) {
  main()
}

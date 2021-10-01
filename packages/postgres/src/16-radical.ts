import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function populate(db: ConnectionPool, dir = '/app/assets') {
  process.chdir(dir)

  const s3 = sqlite3('./radical.db', {
    readonly: true
  })
  const reHan = /\p{sc=Han}/gu
  const getHan = (s = '') => {
    let m: RegExpExecArray | null = null
    reHan.lastIndex = 0

    const out: string[] = []
    while ((m = reHan.exec(s))) {
      out.push(m[0])
    }

    return out
  }

  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = s3
      .prepare(
        /* sql */ `
    SELECT "entry", "sub", "sup", "var"
    FROM radical
    `
      )
      .all()
      .map((p) => {
        return sql`(${p.entry}, ${getHan(p.sub)}, ${getHan(p.sup)}, ${getHan(
          p.var
        )})`
      })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO "radical" ("entry", "sub", "sup", "var")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await populate(db, './assets')
  })()
}

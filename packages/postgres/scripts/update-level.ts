import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import { Level } from '@patarapolw/zhlevel'

export async function populate(db: ConnectionPool) {
  const lv = new Level()

  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = (
      await db.query(sql`
    SELECT "id", "entry" FROM "entry" WHERE "type" != 'character'
    `)
    ).map((p) => {
      const vLevel = Math.min(...p.entry.map((el: string) => lv.vLevel(el)))

      return sql`
        UPDATE "entry"
        SET "level" = ${vLevel}
        WHERE "id" = ${p.id}
        `
    })

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql.join(lots.slice(i, i + batchSize), ';'))
    }
  })

  lv.db.close()
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await populate(db)
  })()
}

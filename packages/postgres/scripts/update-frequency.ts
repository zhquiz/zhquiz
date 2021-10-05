import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import axios, { AxiosResponse } from 'axios'

export async function populate(db: ConnectionPool) {
  await db.tx(async (db) => {
    const batchSize = 10000

    const lots = await db.query(sql`
    SELECT "id", "entry" FROM "entry" WHERE "type" = 'sentence' AND 'tatoeba' != ANY("tag")
    `)

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      const sublot = lots.slice(i, i + batchSize)

      const { data: fMap } = await axios.post<
        any,
        AxiosResponse<Record<string, number>>
      >('https://cdn.zhquiz.cc/api/wordfreq?lang=zh', {
        q: [...new Set(sublot.flatMap((p) => p.entry))]
      })
      for (const p of sublot) {
        p.frequency = Math.min(...p.entry.map((el: string) => fMap[el] || 0))
      }

      await db.query(
        sql.join(
          Object.values(sublot)
            .filter((p) => p.frequency)
            .map((p) => {
              return sql`
          UPDATE "entry"
          SET "level" = ${p.frequency}
          WHERE "id" = ${p.id}
          `
            }),
          ';'
        )
      )
    }
  })
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await populate(db)
  })()
}

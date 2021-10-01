import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'
import { Frequency, Level, makePinyin } from '@patarapolw/zhlevel'

export async function populate(db: ConnectionPool, dir = '/app/assets') {
  process.chdir(dir)

  const s3 = sqlite3('./zhlevel.db', {
    readonly: true
  })
  const f = new Frequency()
  const lvGen = new Level()

  await db.tx(async (db) => {
    console.log('Hanzi')

    const items = s3
      .prepare(
        /* sql */ `
    SELECT
      "entry",
      hLevel
    FROM zhlevel
    WHERE hLevel IS NOT NULL
    `
      )
      .all()

    const lvMap = new Map<number, string[]>()
    items.map((c) => {
      lvMap.set(c.hLevel, [...(lvMap.get(c.hLevel) || []), c.entry])
    })

    for (const [lv, vs] of lvMap) {
      const rs = new Set(
        (
          await db.query(sql`
            SELECT "entry" FROM "entry" WHERE "type" = 'character' AND "entry" && ${vs}
          `)
        ).flatMap((r) => r.entry)
      )

      const newItems = vs.filter((v) => !rs.has(v))
      if (newItems.length) {
        await db.query(sql`
          INSERT INTO "entry" ("type", "entry", "reading", "frequency", "level", "hLevel")
          VALUES ${sql.join(
            newItems.map(
              (v) =>
                sql`('character', ${[v]}, ${[makePinyin(v)]}, ${f.cFreq(
                  v
                )}, ${lv}, ${lv})`
            ),
            ','
          )}
          ON CONFLICT DO NOTHING
        `)
      }

      await db.query(sql`
        UPDATE "entry"
        SET "level" = ${lv}, "tag" = array_distinct("tag"||${['zhlevel']})
        WHERE "type" = 'character' AND "entry" && ${vs}
      `)
    }
  })

  await db.tx(async (db) => {
    console.log('Vocabulary')

    const items = s3
      .prepare(
        /* sql */ `
    SELECT
      "entry",
      vLevel
    FROM zhlevel
    WHERE vLevel IS NOT NULL
    `
      )
      .all()

    const lvMap = new Map<number, string[]>()
    items.map((c) => {
      lvMap.set(c.vLevel, [...(lvMap.get(c.vLevel) || []), c.entry])
    })

    for (const [lv, vs] of lvMap) {
      const rs = new Set(
        (
          await db.query(sql`
            SELECT "entry" FROM "entry" WHERE "type" = 'vocabulary' AND "entry" && ${vs}
          `)
        ).flatMap((r) => r.entry)
      )

      const newItems = vs.filter((v) => !rs.has(v))
      if (newItems.length) {
        await db.query(sql`
          INSERT INTO "entry" ("type", "entry", "reading", "frequency", "level", "hLevel")
          VALUES ${sql.join(
            newItems.map(
              (v) =>
                sql`('vocabulary', ${[v]}, ${[makePinyin(v)]}, ${f.vFreq(
                  v
                )}, ${lv}, ${lvGen.hLevel(v)})`
            ),
            ','
          )}
          ON CONFLICT DO NOTHING
        `)
      }

      await db.query(sql`
        UPDATE "entry"
        SET "level" = ${lv}, "tag" = array_distinct("tag"||${['zhlevel']})
        WHERE "type" = 'vocabulary' AND "entry" && ${vs}
      `)
    }
  })

  s3.close()
  f.close()
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await populate(db, './assets')
  })()
}

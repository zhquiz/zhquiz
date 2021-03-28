/**
 * 20000 chinese - english sentences with proper pinyin
 *
 * @see https://ankiweb.net/shared/info/765328824
 */

// import { execSync } from 'child_process'

import sql from '@databases/sql'
import { db } from '~/server/shared'
import sqlite3 from 'better-sqlite3'

async function main() {
  process.chdir(__dirname)

  // execSync(
  //   /* sh */ `
  // unzip 765328824.apkg collection.anki2
  // mv collection.anki2 collection.db
  // `,
  //   {
  //     stdio: 'inherit',
  //   }
  // )

  const s3 = sqlite3('collection.db')
  const models = JSON.parse(
    s3
      .prepare(
        /* sql */ `
  SELECT models FROM col
  `
      )
      .get().models
  )
  // console.dir(models, { depth: null })

  // Get Model ID from the console
  const mid = 1342695630715

  const headers: string[] = (models[mid.toString()].flds as any[]).map(
    (f) => f.name
  )

  const lots = s3
    .prepare(
      /* sql */ `
  SELECT flds FROM notes WHERE mid = @mid
  `
    )
    .all({ mid })
    .map(({ flds }) =>
      (flds.split('\x1f') as string[]).reduce(
        (prev, f, i) => ({
          ...prev,
          [headers[i]]: f,
        }),
        {} as Record<string, string>
      )
    )

  // console.log(lots)

  s3.close()

  console.log(process.env.DEFAULT_USER)

  const [{ id: userId }] = await db.query(sql`
  SELECT "id" FROM "user" WHERE "identifier" = ${process.env.DEFAULT_USER}
  `)

  await db.tx(async (db) => {
    const batchSize = 10000

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log(i)
      await db.query(sql`
        INSERT INTO extra ("entry", "english", "type", "tag", "userId")
        VALUES ${sql.join(
          lots
            .slice(i, i + batchSize)
            .map(
              (r) =>
                sql`(${[r.Expression]}, ${[r.Meaning]}, 'sentence', ${[
                  'anki-765328824',
                ]}, ${userId})`
            ),
          ','
        )}
      `)
    }
  })

  console.log('Updating materialized view')
  await db.query(sql`
    REFRESH MATERIALIZED VIEW CONCURRENTLY sentence;
    REFRESH MATERIALIZED VIEW CONCURRENTLY dict.cedict_view;
  `)

  await db.dispose()
}

if (require.main === module) {
  main()
}

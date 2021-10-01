import fs from 'fs'

import createConnectionPool, { ConnectionPool, sql } from '@databases/pg'
import fg from 'fast-glob'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

const sEntry = S.shape({
  entry: S.string(),
  alt: S.list(S.string()).optional(),
  reading: S.list(S.string()).optional(),
  english: S.list(S.string()).optional()
})

export const sLibrary = S.shape({
  id: S.string().format('uuid'),
  createdAt: S.instanceOf(Date).optional(),
  updatedAt: S.instanceOf(Date).optional(),
  isShared: S.boolean().optional(),
  title: S.string(),
  entries: S.list(
    S.anyOf(
      S.string(),
      S.shape({
        entry: S.string(),
        alt: S.list(S.string()).optional(),
        reading: S.anyOf(S.string(), S.list(S.string())).optional(),
        translation: S.anyOf(S.string(), S.list(S.string())).optional(),
        english: S.anyOf(S.string(), S.list(S.string())).optional()
      }).additionalProperties(true)
    )
  ).minItems(1),
  type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
  description: S.string().optional(),
  tag: S.list(S.string()).optional()
}).additionalProperties(true)

export async function populate(db: ConnectionPool, dir = '/app/library') {
  process.chdir(dir)

  await db.tx(async (db) => {
    for (const filename of await fg(['**/*.yaml'])) {
      console.log(filename)

      const rs = S.list(sLibrary).ensure(
        yaml.load(fs.readFileSync(filename, 'utf-8')) as any
      )

      await db.query(sql`
      INSERT INTO "library" ("id", "title", "entries", "type", "tag", "createdAt", "updatedAt", "description", "isShared")
      VALUES ${sql.join(
        rs.map(
          (r) =>
            sql`(${r.id}, ${r.title}, ${JSON.stringify(
              r.entries.map((el) => {
                if (typeof el === 'string') {
                  return sEntry.ensure({ entry: el })
                }

                el.english = el.english || el.translation

                return sEntry.ensure({
                  entry: el.entry,
                  alt: el.alt,
                  reading:
                    typeof el.reading === 'string' ? [el.reading] : el.reading,
                  english:
                    typeof el.english === 'string' ? [el.english] : el.english
                })
              })
            )}::jsonb, ${r.type || 'vocabulary'}, ${r.tag || []}, ${
              r.createdAt
            }, ${r.updatedAt}, ${r.description || ''}, ${r.isShared !== false})`
        ),
        ','
      )}
      ON CONFLICT ("id")
      DO UPDATE SET
        "title" = EXCLUDED."title",
        "entries" = EXCLUDED."entries",
        "type" = EXCLUDED."type",
        "tag" = EXCLUDED."tag",
        "createdAt" = COALESCE(EXCLUDED."createdAt", library."createdAt"),
        "description" = EXCLUDED."description",
        "isShared" = EXCLUDED."isShared"
      `)
    }
  })
}

export async function constraint(db: ConnectionPool) {
  await db.query(sql`
  ALTER TABLE "library" ADD CONSTRAINT c_library_entries CHECK (validate_json_schema('${sql.__dangerous__rawValue(
    JSON.stringify(S.list(sEntry).minItems(1).valueOf())
  )}', "entries"))
  `)
}

if (require.main === module) {
  ;(async function () {
    const db = createConnectionPool({ bigIntMode: 'number' })
    await constraint(db)
    await populate(db, './library')
  })()
}

import fs from 'fs'

import { ConnectionPool, sql } from '@databases/pg'
import fg from 'fast-glob'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

export const sLibrary = S.shape({
  id: S.string().format('uuid'),
  createdAt: S.instanceOf(Date).optional(),
  updatedAt: S.instanceOf(Date).optional(),
  isShared: S.boolean().optional(),
  title: S.string(),
  entry: S.list(S.string()).minItems(1),
  type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
  description: S.string().optional(),
  tag: S.list(S.string()).optional()
}).additionalProperties(true)

export async function populate(db: ConnectionPool, dir = '/app/library') {
  process.chdir(dir)

  await db.tx(async (db) => {
    for (const filename of await fg(['**/*.yaml'])) {
      const rs = S.list(sLibrary).ensure(
        yaml.load(fs.readFileSync(filename, 'utf-8')) as any
      )

      await db.query(sql`
      INSERT INTO "library" ("id", "title", "entry", "type", "tag", "createdAt", "updatedAt", "description", "isShared")
      VALUES ${sql.join(
        rs.map(
          (r) =>
            sql`(${r.id}, ${r.title}, ${r.entry}, ${r.type || 'vocabulary'}, ${
              r.tag || []
            }, ${r.createdAt || new Date()}, ${
              r.updatedAt || r.createdAt || new Date()
            }, ${r.description || ''}, ${r.isShared !== false})`
        ),
        ','
      )}
      ON CONFLICT ("id")
      DO UPDATE SET
        "title" = EXCLUDED."title",
        "entry" = EXCLUDED."entry",
        "type" = EXCLUDED."type",
        "tag" = EXCLUDED."tag",
        "createdAt" = EXCLUDED."createdAt",
        "description" = EXCLUDED."description",
        "isShared" = EXCLUDED."isShared"
      `)
    }
  })

  await db.query(sql`
    REFRESH MATERIALIZED VIEW entry_tag;
  `)
}

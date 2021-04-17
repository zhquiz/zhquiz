import fs from 'fs'

import sql from '@databases/sql'
import yaml from 'js-yaml'

import { db } from '../src/init'

async function main() {
  {
    const rs = await db.query(sql`
    SELECT "id", "createdAt", "updatedAt", "isShared", "type", "entries", "title", "description", "tag"
    FROM "library"
    WHERE "userId" IS NULL
    ORDER BY "updatedAt", "title"
    `)

    fs.writeFileSync(
      './library/_export.yaml',
      yaml.dump(rs, {
        flowLevel: 3
      })
    )
  }

  await db.dispose()
}

if (require.main === module) {
  main()
}

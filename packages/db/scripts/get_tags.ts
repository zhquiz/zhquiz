import sql from '@databases/sql'

import { db } from '../src/init'

async function main() {
  const rs1 = await db.query(sql`
  SELECT
    "tag",
    "type",
    "userId",
    "entry"
  FROM "extra"
  UNION
  SELECT
    "tag",
    "type",
    "userId",
    "entry"
  FROM "library"
  UNION
  SELECT
    "tag",
    "type",
    NULL "userId",
    "entry"
  FROM dict.entries
  `)

  console.dir(rs1, { depth: null })

  await db.dispose()
}

if (require.main === module) {
  main()
}

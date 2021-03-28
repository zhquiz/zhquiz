import { populate } from '~/server/db/14-cedict'
import { db } from '~/server/shared'

async function main() {
  process.chdir('./db/assets')
  await populate(db)
  await db.dispose()
}

if (require.main === module) {
  main()
}
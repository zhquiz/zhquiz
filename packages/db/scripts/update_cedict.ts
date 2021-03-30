import { populate } from '../src/14-cedict'
import { db } from '../src/init'

async function main() {
  process.chdir('./db/assets')
  await populate(db)
  await db.dispose()
}

if (require.main === module) {
  main()
}

import { populate } from '../src/30-jukuu'
import { db } from '../src/init'

async function main() {
  process.chdir('./db/assets')
  await populate(db)
  await db.dispose()
}

if (require.main === module) {
  main()
}

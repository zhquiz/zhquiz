import { populate } from '../src/13-tatoeba'
import { db } from '../src/init'

async function main() {
  process.chdir('./db/assets')
  await populate(db)
  await db.dispose()
}

if (require.main === module) {
  main()
}

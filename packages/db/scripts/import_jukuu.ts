import { populate } from '../src/30-jukuu'
import { db } from '../src/init'

async function main() {
  process.chdir('./assets')
  await populate(db)
  await db.dispose()
}

if (require.main === module) {
  main()
}

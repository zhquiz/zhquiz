import { populate } from '../src/23-library'
import { db } from '../src/init'

async function main() {
  await populate(db, './library')
  await db.dispose()
}

if (require.main === module) {
  main().catch((e) => console.error(e))
}

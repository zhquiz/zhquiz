import createConnectionPool, { ConnectionPool } from '@databases/pg'

import * as tatoeba from './13-tatoeba'
import * as cedict from './14-cedict'
import * as junda from './15-junda'
import * as radical from './16-radical'
import * as level from './18-level'
import * as lib from './23-library'
import * as jukuu from './30-jukuu'

export let db: ConnectionPool

// @ts-ignore
if (!db) {
  db = createConnectionPool(
    process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          bigIntMode: 'number'
        }
      : {
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          bigIntMode: 'number'
        }
  )
}

if (require.main === module) {
  ;(async () => {
    try {
      await tatoeba.populate(db)
      await cedict.populate(db)
      await junda.populate(db)
      await radical.populate(db)
      await level.populate(db)
      await lib.populate(db)
      await jukuu.populate(db)
    } catch (e) {
      console.error(e)
    }

    await db.dispose()
  })()
}

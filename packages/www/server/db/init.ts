import { db } from '../shared'
import * as tatoeba from './13-tatoeba'
import * as cedict from './14-cedict'
import * as junda from './15-junda'
import * as radical from './16-radical'
import * as level from './18-level'
import * as jukuu from './30-jukuu'

if (require.main === module) {
  process.chdir('/app/db/assets')
  ;(async () => {
    try {
      await tatoeba.populate(db)
      await cedict.populate(db)
      await junda.populate(db)
      await radical.populate(db)
      await level.populate(db)
      await jukuu.populate(db)
    } catch (e) {
      console.error(e)
    }

    await db.dispose()
  })()
}

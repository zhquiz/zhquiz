import sql from '@databases/sql'

import { db } from '../shared'

const isPending: Record<string, Promise<any[]> | undefined> = {}

export async function refresh(view: string) {
  if (!isPending[view]) {
    isPending[view] = new Promise((resolve, reject) => {
      db.query(
        sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${sql.__dangerous__rawValue(
          view
        )}`
      )
        .then(resolve)
        .catch(reject)
    })
  }
  await isPending[view]
}

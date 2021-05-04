// import sql from '@databases/sql'

// import { db } from '../shared'

// const isPending: Record<string, Promise<any[]> | undefined> = {}

// export async function refresh(view: string) {
//   if (!isPending[view]) {
//     isPending[view] = new Promise((resolve, reject) => {
//       db.query(sql`SELECT refresh_mv_dynamic(${view})`)
//         .then(resolve)
//         .catch(reject)
//     })
//   }
//   await isPending[view]
// }

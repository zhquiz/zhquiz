import { FastifyInstance } from 'fastify'

import { g } from '../shared'

const apiRouter = (f: FastifyInstance, _: unknown, next: () => void) => {
  f.addHook('preHandler', (req) => {
    let r = g.server.db.prepare(/* sql */ `SELECT id FROM user`).get()

    if (r) {
      req.session.set('userId', r.id)
      return
    }

    const id = g.server.db
      .prepare(
        /* sql */ `
      INSERT INTO user () VALUES ()
      `
      )
      .run().lastInsertRowid as number
    req.session.set('userId', id)
  })

  f.get('/isReady', async () => {
    return {}
  })

  next()
}

export default apiRouter

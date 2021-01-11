import { FastifyInstance } from 'fastify'

import { g } from '../shared'

const apiRouter = (f: FastifyInstance, _: unknown, next: () => void) => {
  f.addHook('preHandler', async (req) => {
    let r = await g.server.db.get<{
      id: string
    }>(/* sql */ `SELECT id FROM user`)

    if (r) {
    }

    req.session.set('userId', r.id)
  })

  next()
}

export default apiRouter

import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectID } from 'mongodb'

export function checkAuthorize(req: FastifyRequest, reply: FastifyReply) {
  const u = req.session.get('user')
  if (!u || !u._id) {
    reply.status(401)
    return null
  }

  return new ObjectID(u._id)
}

export function restoreDate(obj: any): any {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map((a) => restoreDate(a))
    } else if (obj.$toDate) {
      return new Date(obj.$toDate)
    } else {
      return Object.entries(obj)
        .map(([k, v]) => [k, restoreDate(v)])
        .reduce((prev, [k, v]) => ({ ...prev, [k]: v }), {})
    }
  }

  return obj
}

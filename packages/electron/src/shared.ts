import type { Server } from './server'

class GlobalObject {
  server!: Server
}

export const g = new GlobalObject()

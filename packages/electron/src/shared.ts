import path from 'path'

import type { Server } from './server'

class GlobalObject {
  server!: Server

  getPath(...ps: string[]) {
    return path.join(__dirname, '..', ...ps)
  }
}

export const g = new GlobalObject()

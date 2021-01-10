import path from 'path'

import ON_DEATH from 'death'
import fastify, { FastifyInstance } from 'fastify'
import fastifyStatic from 'fastify-static'
import pino from 'pino'

import { g } from './shared'

interface IServerOptions {
  port: number
  userDataDir: string
}

export class Server implements IServerOptions {
  static async init(opts: IServerOptions) {
    const logger = pino()
    const app = fastify({
      logger
    })

    app.register(fastifyStatic, {
      root: path.resolve('public')
    })

    await new Promise<void>((resolve, reject) => {
      app.listen(opts.port, (err) => {
        if (err) {
          reject(err)
          return
        }

        logger.info(`Server is running at http://localhost:${opts.port}`)
        resolve()
      })
    })

    g.server = new this(app, opts, logger)
    return g.server
  }

  port: number
  userDataDir: string

  private isCleanedUp = false

  private constructor(
    private app: FastifyInstance,
    opts: IServerOptions,
    public logger: pino.Logger
  ) {
    this.port = opts.port
    this.userDataDir = opts.userDataDir

    ON_DEATH(() => {
      this.cleanup()
    })
  }

  async cleanup() {
    if (this.isCleanedUp) {
      return
    }
    this.isCleanedUp = true

    await this.app.close()
  }
}

if (require.main === module) {
  Server.init({
    port: 5000,
    userDataDir: '.'
  })
}

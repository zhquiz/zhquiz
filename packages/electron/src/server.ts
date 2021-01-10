import path from 'path'

import ON_DEATH from 'death'
import fastify, { FastifyInstance } from 'fastify'
import fastifyStatic from 'fastify-static'
import pino from 'pino'
import * as sqlite from 'sqlite'
import sqlite3 from 'sqlite3'

import { g } from './shared'

interface IServerOptions {
  port: number
  userDataDir: string
  assetsDir: string
}

interface IServerAssets {
  logger: pino.Logger
  zh: sqlite.Database
}

export class Server implements IServerOptions, IServerAssets {
  static async init(opts: IServerOptions) {
    const zh = await sqlite.open({
      filename: path.join(opts.assetsDir, 'zh.db'),
      mode: sqlite3.OPEN_READONLY,
      driver: sqlite3.Database
    })

    const logger = pino()
    const app = fastify({
      logger
    })

    app.register(fastifyStatic, {
      root: g.getPath('public'),
      redirect: true
    })

    await new Promise<void>((resolve, reject) => {
      app.listen(opts.port, (err) => {
        if (err) {
          reject(err)
          return
        }

        resolve()
      })
    })

    g.server = new this(app, opts, { logger, zh })
    return g.server
  }

  port: number
  userDataDir: string
  assetsDir: string

  logger: pino.Logger
  zh: sqlite.Database

  private isCleanedUp = false

  private constructor(
    private app: FastifyInstance,
    opts: IServerOptions,
    assets: IServerAssets
  ) {
    this.port = opts.port
    this.userDataDir = opts.userDataDir
    this.assetsDir = opts.assetsDir

    this.logger = assets.logger
    this.zh = assets.zh

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
    await this.zh.close()
  }
}

if (require.main === module) {
  Server.init({
    port: 5000,
    userDataDir: '.',
    assetsDir: 'assets'
  })
}

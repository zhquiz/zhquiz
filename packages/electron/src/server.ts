import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import sqlite from 'better-sqlite3'
import ON_DEATH from 'death'
import fastify, { FastifyInstance } from 'fastify'
import SecureSessionPlugin from 'fastify-secure-session'
import fastifyStatic from 'fastify-static'
import pino from 'pino'

import apiRouter from './api'
import { Database } from './db'
import { g } from './shared'

interface IServerOptions {
  port: number
  userDataDir: string
  assetsDir: string
}

interface IServerAssets {
  logger: pino.Logger
  zh: sqlite.Database
  db: sqlite.Database
}

export class Server implements IServerOptions, IServerAssets {
  static async init(opts: IServerOptions) {
    const zh = sqlite(path.join(opts.assetsDir, 'zh.db'), { readonly: true })
    const db = sqlite(path.join(opts.userDataDir, 'data.db'))

    const logger = pino(
      fs.createWriteStream(path.join(opts.userDataDir, 'server.log'))
    )
    const app = fastify({
      logger
    })

    const sessionKey = path.join(opts.assetsDir, 'session-key')
    if (!fs.existsSync(sessionKey)) {
      fs.writeFileSync(
        sessionKey,
        spawnSync(g.getPath('node_modules/.bin/secure-session-gen-key'), {
          encoding: 'buffer'
        }).stdout
      )
    }
    app.register(SecureSessionPlugin, {
      key: sessionKey
    })

    app.register(fastifyStatic, {
      root: g.getPath('public'),
      redirect: true
    })

    app.register(apiRouter, {
      prefix: '/api'
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

    g.server = new this(app, opts, { logger, zh, db })
    Database.init()

    return g.server
  }

  port: number
  userDataDir: string
  assetsDir: string

  logger: pino.Logger
  zh: sqlite.Database
  db: sqlite.Database

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
    this.db = assets.db

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
    this.db.close()
    this.zh.close()
  }
}

if (require.main === module) {
  Server.init({
    port: 5000,
    userDataDir: '.',
    assetsDir: 'assets'
  })
}

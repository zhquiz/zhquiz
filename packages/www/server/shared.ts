import fs from 'fs'
import path from 'path'

import createConnectionPool, { ConnectionPool } from '@databases/pg'
import { Magic } from '@magic-sdk/admin'

export const isDev = process.env.NODE_ENV === 'development'

export let db: ConnectionPool

// @ts-ignore
if (!db) {
  db = createConnectionPool({
    ...(process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
        }
      : {
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT!),
        }),
    bigIntMode: 'number',
    ssl: fs.existsSync(path.join(__dirname, '../.postgresql/postgresql.key')),
  })
}

export const magic = process.env.MAGIC_SECRET
  ? new Magic(process.env.MAGIC_SECRET)
  : null

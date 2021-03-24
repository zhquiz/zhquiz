import createConnectionPool, { ConnectionPool } from '@databases/pg'

export const isDev = process.env.NODE_ENV === 'development'

export let db: ConnectionPool

// @ts-ignore
if (!db) {
  db = createConnectionPool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    bigIntMode: 'number',
  })
}

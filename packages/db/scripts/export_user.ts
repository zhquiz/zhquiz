import { execSync } from 'child_process'

async function main() {
  process.chdir('./initdb.d')

  execSync(
    /* sh */ `
  pg_dump --data-only -h localhost -p 5433 --schema=public postgres > 80-user-dump.sql
  `,
    {
      env: {
        PGDATABASE: process.env.POSTGRES_DB,
        PGPORT: '5433',
        PGUSER: process.env.POSTGRES_USER
      },
      stdio: 'pipe'
    }
  )
}

if (require.main === module) {
  main()
}

import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  console.log(
    db
      .prepare(
        /* sql */ `
  SELECT chinese FROM sentence
  WHERE [level] IS NOT NULL and [level] <= 1
  `
      )
      .all()
  )

  db.close()
}

if (require.main === module) {
  main()
}

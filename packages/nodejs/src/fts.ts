import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  console.log(
    db
      .prepare(
        /* sql */ `
  SELECT frequency
  FROM token
  JOIN token_q ON token_q.entry = token.entry
  WHERE token_q MATCH @q
  ORDER BY frequency DESC
  LIMIT 2000
  `
      )
      .all({
        q: 'tag:HSK6'
      })
      .pop()
  )

  // db.prepare(
  //   /* sql */ `
  // UPDATE token_q
  // SET tag = tag||' '||@tag
  // WHERE token_q MATCH @q AND [entry] IN (
  //   SELECT [entry] FROM token WHERE frequency < 8 AND frequency > 4
  // )
  // `
  // ).run({
  //   q: 'tag:HSK6',
  //   tag: 'HSK6_set4'
  // })

  db.close()
}

if (require.main === module) {
  main()
}

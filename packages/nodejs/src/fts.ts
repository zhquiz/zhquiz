import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  db.exec(/* sql */ `
  CREATE VIRTUAL TABLE token_q USING fts5(
    [entry],
    [description],
    [tag]
  );

  INSERT INTO token_q
  SELECT [entry], [description], [tag]
  FROM token
  WHERE [description] IS NOT NULL OR [tag] IS NOT NULL;
  `)

  db.close()
}

if (require.main === module) {
  main()
}

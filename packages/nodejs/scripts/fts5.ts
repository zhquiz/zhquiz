import XRegExp from 'xregexp'
import jieba from 'nodejieba'
import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  {
    db.exec(/* sql */ `
    -- < 120,000 rows
    CREATE TABLE cedict_c (
      id  INT NOT NULL,
      c   TEXT NOT NULL,
      PRIMARY KEY(id, c)
    );
    `)

    const allItems = db
      .prepare(
        /* sql */ `
    SELECT ROWID id, simplified||COALESCE(traditional, '') cs
    FROM cedict;
    `
      )
      .all()

    const stmt = db.prepare(/* sql */ `
    INSERT INTO cedict_c (id, c)
    VALUES (@id, @c)
    `)

    db.transaction(() => {
      allItems.map(({ id, cs }) => {
        Array.from(
          new Set([...cs.replace(XRegExp('[^\\p{Han}]', 'g'), '')])
        ).map((c) => {
          if (c) {
            stmt.run({ id, c })
          }
        })
      })
    })()
  }

  {
    db.exec(/* sql */ `
    -- < 50,000 rows
    CREATE TABLE sentence_c (
      id  INT NOT NULL,
      c   TEXT NOT NULL,
      PRIMARY KEY(id, c)
    );

    CREATE TABLE sentence_w (
      id  INT NOT NULL,
      w   TEXT NOT NULL,
      PRIMARY KEY(id, w)
    );
    `)

    const allItems = db
      .prepare(
        /* sql */ `
      SELECT id, chinese
      FROM sentence;
      `
      )
      .all()

    const stmtC = db.prepare(/* sql */ `
    INSERT INTO sentence_c (id, c)
    VALUES (@id, @c)
    `)

    const stmtW = db.prepare(/* sql */ `
    INSERT INTO sentence_w (id, w)
    VALUES (@id, @w)
    `)

    db.transaction(() => {
      allItems.map(({ id, chinese }) => {
        Array.from(
          new Set([...chinese.replace(XRegExp('[^\\p{Han}]', 'g'), '')])
        ).map((c) => {
          if (c) {
            stmtC.run({ id, c })
          }
        })

        Array.from(
          new Set(
            jieba
              .cutForSearch(chinese)
              .filter((s) => XRegExp('\\p{Han}').test(s))
          )
        ).map((w) => {
          if (w) {
            stmtW.run({ id, w })
          }
        })
      })
    })()
  }

  db.close()
}

if (require.main === module) {
  main()
}

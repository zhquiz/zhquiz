import sqlite3 from 'better-sqlite3'

require('log-buffer')

function notSpace(c: string) {
  return c && c !== ' '
}

function indicesOf(str: string, c: string) {
  const indices: number[] = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === c && notSpace(str[i - 1]) && notSpace(str[i + 1])) {
      indices.push(i)
    }
  }

  return indices
}

async function main() {
  const db = sqlite3('assets/zh.db')

  const newEnglish = new Map<number, string>()

  db.prepare(
    /* sql */ `
  SELECT id, english FROM vocab
  WHERE english IS NOT NULL
  `
  )
    .all()
    .map(({ id, english }: { id: number; english: string }) => {
      const indices = indicesOf(english, '/')
      if (indices.length > 0) {
        indices.map((c, i) => {
          c += i * 2
          english = english.substr(0, c) + ' / ' + english.substr(c + 1)
        })
        newEnglish.set(id, english)
      }
    })

  db.transaction(() => {
    const stmt = db.prepare(/* sql */ `
    UPDATE vocab
    SET english = ?
    WHERE id = ?
    `)

    Array.from(newEnglish).map(([id, english]) => {
      stmt.run(english, id)
    })
  })()

  db.close()
}

main()

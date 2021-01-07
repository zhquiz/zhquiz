import fs from 'fs'
import sqlite from 'better-sqlite3'
import yaml from 'js-yaml'

const lib = [
  {
    title: 'HSK',
    children: [
      {
        title: 'HSK1',
        q: 'tag:HSK1'
      },
      {
        title: 'HSK2',
        q: 'tag:HSK2'
      },
      {
        title: 'HSK3',
        q: 'tag:HSK3'
      },
      {
        title: 'HSK4 (Set 1)',
        q: 'tag:HSK4 tag:HSK4_set1'
      },
      {
        title: 'HSK4 (Set 2)',
        q: 'tag:HSK4 NOT tag:HSK4_set1'
      },
      {
        title: 'HSK5 (Set 1)',
        q: 'tag:HSK5 tag:HSK5_set1'
      },
      {
        title: 'HSK5 (Set 2)',
        q: 'tag:HSK5 tag:HSK5_set2'
      },
      {
        title: 'HSK5 (Set 3)',
        q: 'tag:HSK5 tag:HSK5_set3'
      },
      {
        title: 'HSK5 (Set 4)',
        q: 'tag:HSK5 NOT (tag:HSK5_set1 OR tag:HSK5_set2 OR tag:HSK5_set3)'
      },
      {
        title: 'HSK6 (Set 1)',
        q: 'tag:HSK6 tag:HSK6_set1'
      },
      {
        title: 'HSK6 (Set 2)',
        q: 'tag:HSK6 tag:HSK6_set2'
      },
      {
        title: 'HSK6 (Set 3)',
        q: 'tag:HSK6 tag:HSK6_set3'
      },
      {
        title: 'HSK6 (Set 4)',
        q: 'tag:HSK6 tag:HSK6_set4'
      },
      {
        title: 'HSK6 (Set 5)',
        q:
          'tag:HSK6 NOT (tag:HSK6_set1 OR tag:HSK6_set2 OR tag:HSK6_set3 OR tag:HSK6_set4)'
      }
    ]
  }
]

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  const stmt = db.prepare(/* sql */ `
    SELECT token.entry [entry]
    FROM token
    JOIN token_q ON token_q.entry = token.entry
    WHERE token_q MATCH @q
    GROUP BY token.entry
    ORDER BY frequency DESC
  `)

  fs.writeFileSync(
    '../../assets/library.yaml',
    yaml.safeDump(
      lib.map(({ title, children }) => {
        return {
          title,
          children: children.map(({ title, q }) => {
            return {
              title,
              entries: stmt.all({ q }).map((it) => it.entry)
            }
          })
        }
      }),
      { flowLevel: 4 }
    )
  )

  db.close()
}

if (require.main === module) {
  main()
}

import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/go-zhquiz/assets/zh.db')

  db.function('parse_pinyin', (s: string) => {
    if (/\d($| )/.test(s)) {
      return [
        s,
        s
          .split(' ')
          .map((s0) => s0.replace(/\d($| )/, '$1'))
          .join(' ')
      ]
    }

    return [s]
  })

  db.exec(/* sql */ `
    CREATE VIRTUAL TABLE cedict USING fts5(
      simplified,   -- TEXT NOT NULL
      traditional,  -- TEXT
      pinyin,       -- TEXT NOT NULL
      english,      -- TEXT
      frequency,    -- FLOAT
      tokenize='porter unicode61 parse_pinyin'
    );

    INSERT INTO cedict (simplified, traditional, pinyin, english, frequency)
    SELECT simplified, traditional, pinyin, english, frequency FROM vocab;
  `)

  db.close()
}

if (require.main === module) {
  main()
}

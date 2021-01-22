import sqlite from 'better-sqlite3'
// @ts-ignore
import toPinyin from 'chinese-to-pinyin'

async function main() {
  const db = sqlite('../../submodules/go-zhquiz/assets/zh.db')
  db.function('to_pinyin', (s: string) => {
    return toPinyin(s, { removeTone: true })
  })

  db.function('parse_pinyin', (s: string) => {
    return s.replace(/\d([^A-Za-z]|$)/g, ' ')
  })

  db.function('nullify', (s: string) => {
    if (!s) return null

    s = s.trim()
    if (!s) return null

    return s
  })

  // db.exec(/* sql */ `
  //   ALTER TABLE token_q RENAME TO token_q0;

  //   CREATE VIRTUAL TABLE token_q USING fts5(
  //     [entry],
  //     vocab,
  //     pinyin,
  //     english,
  //     [description],
  //     tag
  //   );

  //   CREATE VIRTUAL TABLE sentence_q USING fts5(
  //     id,
  //     pinyin,
  //     english,
  //     [description],
  //     tag
  //   );
  // `)

  db.exec(/* sql */ `
    DELETE FROM token_q;

    INSERT INTO token_q ([entry], vocab, pinyin, english, [description], tag)
    SELECT
      token.entry,
      nullify(COALESCE(GROUP_CONCAT(simplified, ','), '')||' '||COALESCE(GROUP_CONCAT(traditional, ','), '')) v1,
      nullify(parse_pinyin(COALESCE(token.pinyin, '')||' '||COALESCE(GROUP_CONCAT(vocab.pinyin, ','), ''))) v2,
      nullify(COALESCE(token.english, '')||' '||COALESCE(GROUP_CONCAT(vocab.english, ';'), '')) v3,
      token.description v4,
      token.tag v5
    FROM token
    LEFT JOIN vocab ON vocab.simplified = token.entry OR vocab.traditional = token.entry
    GROUP BY token.entry
    HAVING v1 IS NOT NULL OR v2 IS NOT NULL OR v3 IS NOT NULL OR v4 IS NOT NULL OR v5 IS NOT NULL
  `)

  // db.exec(/* sql */ `
  //   INSERT INTO sentence_q (id, pinyin, english, [description], tag)
  //   SELECT id, to_pinyin(chinese), english, [description], tag
  //   FROM sentence
  // `)

  db.close()
}

if (require.main === module) {
  main()
}

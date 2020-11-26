import path from 'path'

import sqlite3 from 'better-sqlite3'
import jieba from 'nodejieba'
import XRegExp from 'xregexp'

// eslint-disable-next-line no-use-before-define
export let zh: Zh

export interface IZhSentence {
  id: number
  chinese: string
  pinyin?: string | null
  english: string[]
  frequency?: number
}

class Zh {
  db: sqlite3.Database
  custom: sqlite3.Database

  constructor(public dir: string) {
    this.db = sqlite3(path.join(dir, 'zh.db'))
    this.custom = sqlite3(path.join(dir, 'custom.db'))

    this.initDb()
    this.initCustom()
  }

  initDb() {
    this.db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS tag (
      id        INT PRIMARY KEY,
      [name]    TEXT NOT NULL UNIQUE COLLATE NOCASE
    );
    `)

    this.db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS token (
      [entry]       TEXT PRIMARY KEY,
      -- sub m2m
      -- sup m2m
      -- var m2m
      frequency     FLOAT,
      hanzi_level   INT,
      vocab_level   INT,
      -- tag m2m
      pinyin        TEXT,
      english       TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_token_frequency ON token(frequency);
    CREATE INDEX IF NOT EXISTS idx_token_hanzi_level on token(hanzi_level);
    CREATE INDEX IF NOT EXISTS idx_token_vocab_level on token(vocab_level);

    CREATE TABLE IF NOT EXISTS token_sub (
      parent  TEXT NOT NULL REFERENCES token,
      child   TEXT NOT NULL REFERENCES token,
      PRIMARY KEY (parent, child)
    );

    CREATE TABLE IF NOT EXISTS token_sup (
      parent  TEXT NOT NULL REFERENCES token,
      child   TEXT NOT NULL REFERENCES token,
      PRIMARY KEY (parent, child)
    );

    CREATE TABLE IF NOT EXISTS token_var (
      parent  TEXT NOT NULL REFERENCES token,
      child   TEXT NOT NULL REFERENCES token,
      PRIMARY KEY (parent, child)
    );

    CREATE TABLE IF NOT EXISTS token_tag (
      [entry]   TEXT NOT NULL REFERENCES token,
      tag_id    INT NOT NULL REFERENCES token,
      PRIMARY KEY ([entry], tag_id)
    );
    `)

    this.db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS sentence (
      id          INT PRIMARY KEY,
      chinese     TEXT NOT NULL UNIQUE,
      pinyin      TEXT,
      english     TEXT NOT NULL, -- \x1f joined
      frequency   FLOAT,
      [level]     INT
      -- tag m2m
      -- token m2m
    );

    CREATE INDEX IF NOT EXISTS idx_sentence_frequency ON sentence(frequency);
    CREATE INDEX IF NOT EXISTS idx_sentence_level ON sentence([level]);

    CREATE TABLE IF NOT EXISTS sentence_tag (
      sentence_id INT NOT NULL REFERENCES sentence,
      tag_id      INT NOT NULL REFERENCES tag,
      PRIMARY KEY (sentence_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS sentence_token (
      sentence_id INT NOT NULL REFERENCES sentence,
      [entry]     TEXT NOT NULL REFERENCES token,
      PRIMARY KEY (sentence_id, [entry])
    );
    `)

    this.db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS cedict (
      simplified  TEXT NOT NULL,
      traditional TEXT,
      pinyin      TEXT NOT NULL,
      english     TEXT NOT NULL,
      frequency   FLOAT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cedict ON cedict(simplified, traditional, pinyin);
    CREATE INDEX IF NOT EXISTS idx_cedict_frequency ON cedict(frequency);
    `)
  }

  initCustom() {
    this.custom.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS custom (
      id        INT PRIMARY KEY,
      [entry]   TEXT NOT NULL UNIQUE REFERENCES [entry],
      -- alt m2o
      pinyin    TEXT NOT NULL,
      english   TEXT NOT NULL,
      frequency FLOAT,
      [type]    TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_custom_frequency ON custom(frequency);
    CREATE INDEX IF NOT EXISTS idx_custom_type ON custom([type]);

    CREATE TABLE IF NOT EXISTS custom_alt (
      custom_id INT NOT NULL REFERENCES custom,
      [entry]   TEXT NOT NULL,
      PRIMARY KEY (custom_id, [entry])
    )
    `)
  }

  tagFindOrCreate(names: string[]): number[] {
    const m = new Map<string, number>()

    this.db
      .prepare(
        /* sql */ `
    SELECT id, [name]
    FROM tag
    WHERE [name] IN (${Array(names.length)
      .fill(null)
      .map(() => '?')})
    `
      )
      .all(...names)
      .map(({ id, name }) => {
        m.set(name, id)
      })

    const stmt = this.db.prepare(/* sql */ `
    INSERT INTO tag ([name]) values (@name)
    `)

    this.db.transaction((ts: string[]) => {
      ts.map((t) => {
        m.set(t, stmt.run(t).lastInsertRowid as number)
      })
    })(names.filter((n) => !m.has(n)))

    return names.map((n) => m.get(n)!)
  }

  tokenFindOrCreate(names: string[]): string[] {
    const stmt = this.db.prepare(/* sql */ `
    INSERT INTO token ([entry])
    VALUES (@entry)
    ON CONFLICT DO NOTHING
    `)

    this.db.transaction(() => {
      names.map((entry) => {
        stmt.run({ entry })
      })
    })()

    return names
  }

  sentenceCreateMany(its: IZhSentence[]) {
    const wMap = new Map<string, string[]>()

    this.tokenFindOrCreate([
      ...new Set(
        its.flatMap((it) => {
          const segments = [
            ...new Set(
              jieba
                .cutForSearch(it.chinese)
                .filter((s) => XRegExp('\\p{Han}').test(s))
            )
          ]
          wMap.set(it.chinese, segments)
          return segments
        })
      )
    ])

    {
      const stmt = this.db.prepare(/* sql */ `
      INSERT INTO sentence (id, chinese, pinyin, english, frequency)
      VALUES (@id, @chinese, @pinyin, @english, @frequency)
      `)

      this.db.transaction(() => {
        its.map((it) =>
          stmt.run({
            ...it,
            english: it.english.join('\x1f')
          })
        )
      })()
    }

    {
      const stmt = this.db.prepare(/* sql */ `
      INSERT INTO sentence_token (sentence_id, [entry])
      VALUES (@sentence_id, @entry)
      `)

      this.db.transaction(() => {
        its.map((it) => {
          const tokens = wMap.get(it.chinese)
          if (tokens) {
            tokens.map((entry) => {
              stmt.run({
                sentence_id: it.id,
                entry
              })
            })
          }
        })
      })()
    }

    return its.map((it) => it.id)
  }

  cedictCreate(
    its: {
      simplified: string
      traditional?: string
      pinyin: string
      english: string
      frequency?: number
    }[]
  ): number[] {
    const stmt = this.db.prepare(/* sql */ `
    INSERT INTO cedict (simplified, traditional, pinyin, english, frequency)
    VALUES (@simplified, @traditional, @pinyin, @english, @frequency)
    `)

    return this.db.transaction(() => {
      return its.map((it) => stmt.run(it).lastInsertRowid as number)
    })()
  }
}

export function initZh(filename: string) {
  zh = new Zh(filename)
  return zh
}

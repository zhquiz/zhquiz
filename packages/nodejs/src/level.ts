import XRegExp from 'xregexp'
import { getLevel } from './get-level'
import jieba from 'nodejieba'
import runes from 'runes2'
import sqlite from 'better-sqlite3'

async function make() {
  const db = sqlite('../../assets/zhlevel.db')

  await insertLevel(db)

  // const s = new ChineseSentenceLevel(db)
  // await insertSentence(db, (entries) => s.getLevel(...entries), [])

  console.log(
    db
      .prepare(
        /* sql */ `
    SELECT "entry", length("entry") len
    FROM "zhlevel"
    WHERE length("entry") > 1 AND hLevel IS NOT NULL
  `
      )
      .all()
  )

  db.close()
}

async function insertLevel(db: sqlite.Database) {
  const map = getLevel()

  db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS "zhlevel" (
      "entry"     TEXT PRIMARY KEY NOT NULL,
      "hLevel"    INT,
      "vLevel"    INT,
      CHECK (
        IIF(length("entry") = 1, TRUE, "hLevel" IS NULL)
      )
    );

    CREATE INDEX IF NOT EXISTS "idx_zhlevel_hLevel" ON "zhlevel" ("hLevel");
    CREATE INDEX IF NOT EXISTS "idx_zhlevel_vLevel" ON "zhlevel" ("vLevel");

    CREATE TRIGGER IF NOT EXISTS "t_zhlevel_update_hLevel" BEFORE UPDATE ON "zhlevel"
    FOR EACH ROW
    WHEN OLD.hLevel IS NOT NULL AND NEW.hLevel IS NULL
    BEGIN
      UPDATE "zhLevel" SET "entry" = NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS "t_zhlevel_update_vLevel" BEFORE UPDATE ON "zhlevel"
    FOR EACH ROW
    WHEN OLD.vLevel IS NOT NULL AND NEW.vLevel IS NULL
    BEGIN
      UPDATE "zhLevel" SET "entry" = NULL;
    END;
  `)

  const stmt = db.prepare(/* sql */ `
    INSERT INTO "zhlevel" ("entry", "hLevel", "vLevel")
    VALUES (@entry, @hLevel, @vLevel)
  `)

  db.transaction(() => {
    for (const [entry, lv] of map) {
      stmt.run({
        entry,
        hLevel: lv.hLevel,
        vLevel: lv.vLevel
      })
    }
  })()
}

export async function insertSentence(
  db: sqlite.Database,
  fn: (
    entries: string[],
    db: sqlite.Database
  ) => Promise<Record<string, number | null>>,
  entries: string[]
) {
  const sMap = new Map(Object.entries(await fn(entries, db)))

  db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS "sentence" (
      "entry"     TEXT PRIMARY KEY NOT NULL,
      "level"     FLOAT
    );

    CREATE INDEX IF NOT EXISTS "idx_sentence_level" ON "sentence" ("level");
  `)

  const stmt = db.prepare(/* sql */ `
    INSERT INTO "sentence" ("entry", "level")
    VALUES (@entry, @level)
    ON CONFLICT DO UPDATE
    SET "level" = @level
    WHERE "entry" = @entry
  `)

  db.transaction(() => {
    for (const [entry, level] of sMap) {
      stmt.run({
        entry,
        level
      })
    }
  })()
}

class ChineseSentenceLevel {
  constructor(
    public db: sqlite.Database,
    private getVocabLevel = async (
      ...vocabs: string[]
    ): Promise<Record<string, number>> =>
      db
        .prepare(
          /* sql */ `
    SELECT [entry], "vLevel" [level]
    FROM "zhLevel"
    WHERE [entry] IN (${vocabs.fill('?')})
    `
        )
        .all(...vocabs)
        .reduce(
          (prev, { entry, level }) => ({ ...prev, [entry]: level }),
          {} as Record<string, number>
        ),
    private simpChars = new Set<string>(
      db
        .prepare(
          /* sql */ `
    SELECT [entry]
    FROM "zhlevel"
    WHERE "hLevel" <= 50
    `
        )
        .all()
        .map(({ entry }) => entry)
    )
  ) {}

  async getLevel(...sentences: string[]) {
    const segMap = new Map<string, string[]>()

    for (const chinese of sentences) {
      const segments = jieba
        .cutForSearch(chinese)
        .filter((s) => XRegExp('\\p{Han}').test(s))
      segMap.set(chinese, segments)
    }

    const lvList = Object.values(
      await this.getVocabLevel(...new Set([...segMap.values()].flat()))
    )

    const lvMap: Record<string, number | null> = {}

    for (const chinese of sentences) {
      const level =
        runes(chinese)
          .filter((s) => XRegExp('\\p{Han}').test(s))
          .every((s) => this.simpChars.has(s)) &&
        lvList.filter((lv) => lv).length
          ? (Math.max(...lvList.filter((lv) => lv)) * lvList.length) /
            lvList.filter((lv) => lv).length
          : null
      lvMap[chinese] = level
    }

    return lvMap
  }
}

if (require.main === module) {
  make()
}

import path from 'path'
import jieba from 'nodejieba'

import sqlite3 from 'better-sqlite3'
//@ts-ignore
import toPinyin from 'chinese-to-pinyin'

export class Frequency {
  db: sqlite3.Database = sqlite3(path.join(__dirname, '../assets/freq.db'), {
    readonly: true
  })

  cStmt: sqlite3.Statement<any> = this.db.prepare(/* sql */ `
    SELECT frequency AS f FROM "character" WHERE "entry" = ?;
    `)

  vStmt: sqlite3.Statement<any> = this.db.prepare(/* sql */ `
    SELECT frequency AS f FROM "vocabulary" WHERE "entry" = ?;
    `)

  cFreq(c: string) {
    return (this.cStmt.get(c)?.f as number) || 0
  }

  _vFreq(v: string) {
    return (this.vStmt.get(v)?.f as number) || 0
  }

  vFreq(v: string) {
    const allLevels = [...new Set(jieba.cutForSearch(v))]
      .filter((v) => /\p{sc=Han}/u.test(v))
      .map((v) => this._vFreq(v) || 0)

    if (allLevels.length) {
      return allLevels.reduce((prev, c) => prev + c, 0) / allLevels.length
    }

    return 0
  }

  close() {
    this.db.close()
  }
}

export class Level {
  db: sqlite3.Database = sqlite3(path.join(__dirname, '../assets/zhlevel.db'), {
    readonly: true
  })

  makeLevel(v: string) {
    const raw = [...new Set(jieba.cutForSearch(v))].filter((v) =>
      /\p{sc=Han}/u.test(v)
    )
    if (!raw.length) {
      return 0
    }

    const segments = this.db
      .prepare(
        /* sql */ `
        SELECT "entry", vLevel "level" FROM zhlevel WHERE vLevel IS NOT NULL AND
        "entry" IN (${Array(raw.length).fill('?').join(',')})
        `
      )
      .all(...raw)

    if (!segments.length) {
      return 100
    }

    const entriesMap = new Map<string, number>()
    segments.map((et) => {
      if (et.level) {
        entriesMap.set(et.entry[0]!, et.level)
      }
    })

    return (
      ([...entriesMap.values()].reduce((prev, c) => prev + c, 0) * raw.length) /
      (entriesMap.size * entriesMap.size)
    )
  }
}

export function makePinyin(entry: string) {
  return toPinyin(entry, {
    toneToNumber: true,
    keepRest: true
  })
}

import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import yaml from 'js-yaml'

class ZhDb {
  db = sqlite3('assets/zh.db', { readonly: true })
  hsk = yaml.safeLoad(fs.readFileSync('assets/hsk.yaml', 'utf8')) as Record<
    string,
    string[]
  >

  private _cache = new Map<string, sqlite3.Statement>()

  get hanziMatch() {
    const data =
      this._cache.get('hanziMatch') ||
      this.db.prepare(/* sql */ `
    SELECT sub, sup, [var], pinyin, english FROM token 
    WHERE
      [entry] = ?
    ORDER BY frequency DESC
    `)
    this._cache.set('hanziMatch', data)

    return data
  }

  get vocabMatch() {
    const data =
      this._cache.get('vocabMatch') ||
      this.db.prepare(/* sql */ `
    SELECT simplified, traditional, pinyin, english FROM vocab 
    WHERE
      simplified = ? OR
      traditional = ?
    ORDER BY rating DESC
    `)
    this._cache.set('vocabMatch', data)

    return data
  }

  vocabQ(opts: { limit: number; offset: number }) {
    return this.db.prepare(/* sql */ `
    SELECT simplified, traditional, v.pinyin AS pinyin, v.english AS english
    FROM vocab v
    LEFT JOIN token t ON t.entry = v.simplified
    WHERE
      simplified LIKE ? OR
      traditional LIKE ?
    ORDER BY frequency DESC, rating DESC
    LIMIT ${opts.limit} OFFSET ${opts.offset}
    `)
  }

  get vocabQCount() {
    const data =
      this._cache.get('vocabQCount') ||
      this.db.prepare(/* sql */ `
    SELECT COUNT(*) AS [count]
    FROM vocab v
    LEFT JOIN token t ON t.entry = v.simplified
    WHERE
      simplified LIKE ? OR
      traditional LIKE ?
    `)
    this._cache.set('vocabQCount', data)

    return data
  }

  get sentenceMatch() {
    const data =
      this._cache.get('sentenceMatch') ||
      this.db.prepare(/* sql */ `
    SELECT chinese, pinyin, english
    FROM sentence
    WHERE chinese = ?
    `)
    this._cache.set('sentenceMatch', data)

    return data
  }

  sentenceQ(opts: { limit: number; offset: number }) {
    return this.db.prepare(/* sql */ `
    SELECT chinese, pinyin, english
    FROM sentence
    WHERE chinese LIKE ?
    ORDER BY frequency DESC
    LIMIT ${opts.limit} OFFSET ${opts.offset}
    `)
  }

  get sentenceQCount() {
    const data =
      this._cache.get('sentenceQCount') ||
      this.db.prepare(/* sql */ `
    SELECT COUNT(*) AS [count]
    FROM sentence
    WHERE chinese LIKE ?
    `)
    this._cache.set('sentenceQCount', data)

    return data
  }

  get sentenceLevel() {
    const data =
      this._cache.get('sentenceLevel') ||
      this.db.prepare(/* sql */ `
    SELECT chinese, [level]
    FROM sentence
    WHERE [level] <= ? AND [level] >= ?
    ORDER BY RANDOM()`)
    this._cache.set('sentenceLevel', data)

    return data
  }

  get findTraditional() {
    return (
      this._cache.get('findTraditional') ||
      this.db.prepare(/* sql */ `
      SELECT traditional
      FROM vocab
      WHERE
        simplified = ? AND traditional IS NOT NULL
      LIMIT 1`)
    )
  }
}

export const zh = new ZhDb()

import { g } from '../shared'

export class DbSentence {
  static init() {
    g.server.db.exec(/* sql */ `
      CREATE TABLE IF NOT EXISTS sentence (
        chinese   TEXT NOT NULL UNIQUE,
        english
      )
    `)
  }
}

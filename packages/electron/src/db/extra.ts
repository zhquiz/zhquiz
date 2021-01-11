import toPinyin from 'chinese-to-pinyin'
import { Ulid } from 'id128'

import { g } from '../shared'

export interface IDbExtra {
  chinese: string
  pinyin?: string
  english?: string
  type?: string
  description?: string
  tag?: string
}

export class DbExtra {
  static tableName = 'extra'

  static async init() {
    await g.server.db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS [${this.tableName}] (
      id          TEXT PRIMARY KEY,
      createdAt   INT strftime('%s','now'),
      updatedAt   INT,
      chinese     TEXT NOT NULL UNIQUE,
      pinyin      TEXT
    );

    CREATE TRIGGER IF NOT EXISTS t_${this.tableName}_updatedAt
      AFTER UPDATE ON [${this.tableName}]
      WHEN NEW.updatedAt IS NULL
      FOR EACH ROW BEGIN
        UPDATE [${this.tableName}] SET updatedAt = strftime('%s','now') WHERE id = NEW.id
      END;
    
    CREATE VIRTUAL TABLE IF NOT EXISTS ${this.tableName}_q USING fts5(
      id,
      chinese,
      pinyin,
      english,
      [type],
      [description],
      tag
    )
    `)
  }

  static async create(...items: IDbExtra[]) {
    const id = Ulid.generate().toCanonical()

    const driver = g.server.db.getDatabaseInstance()

    await new Promise<void>((resolve, reject) => {
      driver.serialize(async () => {
        try {
          const stmt = driver.prepare(/* sql */ `
          INSERT INTO [${this.tableName}] (id, chinese, pinyin)
          `)

          driver.exec('BEGIN TRANSACTION')

          items.map((it) => {
            stmt.run(it)
          })

          driver.exec('COMMIT')
          resolve()
        } catch (e) {
          driver.exec('ROLLBACK TRANSACTION')
          reject(e)
        }
      })
    })

    await g.server.db.run(/* sql */ `
    INSERT INTO [${this.tableName}]
    (id, chinese, pinyin)
    `)
  }

  private constructor(
    public entry: IDbExtra & { id: string; pinyin: string }
  ) {}
}

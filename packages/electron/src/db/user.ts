import S from 'jsonschema-definer'

import { g } from '../shared'

export const sDbUserMeta = S.shape({
  forvo: S.string(),
  level: S.integer().minimum(1).maximum(60),
  levelMin: S.integer().minimum(1).maximum(60),
  settings: S.shape({
    level: S.shape({
      whatToShow: S.list(S.string())
    }),
    quiz: S.shape({
      type: S.list(S.string()),
      stage: S.list(S.string()),
      direction: S.list(S.string()),
      isDue: S.boolean()
    }),
    sentence: S.shape({
      min: S.integer().minimum(2),
      max: S.integer().minimum(5)
    })
  })
})

export type IDbUserMeta = typeof sDbUserMeta.type

export class DbUser {
  static tableName = 'user'

  static async init() {
    await g.server.db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS [${this.tableName}] (
      id          INT PRIMARY KEY DEFAULT 1,
      createdAt   INT strftime('%s','now'),
      updatedAt   INT,
      meta        JSON DEFAULT '{}'
    );

    CREATE TRIGGER IF NOT EXISTS t_${this.tableName}_updatedAt
      AFTER UPDATE ON [${this.tableName}]
      WHEN NEW.updatedAt IS NULL
      FOR EACH ROW BEGIN
        UPDATE [${this.tableName}] SET updatedAt = strftime('%s','now') WHERE id = NEW.id
      END;
    `)
  }
}

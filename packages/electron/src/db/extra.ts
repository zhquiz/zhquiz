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

  static init() {
    g.server.db.exec(/* sql */ `
      CREATE TABLE IF NOT EXISTS [${this.tableName}] (
        id          TEXT PRIMARY KEY,
        createdAt   TIMESTAMP strftime('%s','now'),
        updatedAt   TIMESTAMP strftime('%s','now'),
        chinese     TEXT NOT NULL UNIQUE
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
      );
    `)
  }

  static create(...items: IDbExtra[]) {
    const out: DbExtra[] = []

    g.server.db.transaction(() => {
      const stmt = g.server.db.prepare<{
        id: string
        chinese: string
      }>(/* sql */ `
        INSERT INTO [${this.tableName}] (id, chinese)
        VALUES (@id, @chinese)
      `)

      const stmtQ = g.server.db.prepare<{
        id: string
        chinese: string
        pinyin: string
        english: string
        type: string
        description: string
        tag: string
      }>(/* sql */ `
        INSERT INTO ${this.tableName}_q (id, chinese, pinyin, english, [type], [description], tag)
        VALUES (
          @id,
          jieba(@chinese),
          @pinyin,
          @english,
          @type,
          @description,
          @tag
        )
      `)

      items.map((it) => {
        const id = Ulid.generate().toCanonical()
        const pinyin =
          it.pinyin ||
          toPinyin(it.chinese, { toneToNumber: true, keepRest: true })

        stmt.run({
          id,
          chinese: it.chinese
        })

        stmtQ.run({
          id,
          chinese: it.chinese,
          pinyin,
          english: it.english || '',
          type: it.type || '',
          description: it.description || '',
          tag: it.tag || ''
        })

        out.push(
          new DbExtra({
            ...it,
            id,
            pinyin
          })
        )
      })
    })()

    return out
  }

  static update(...items: (Partial<IDbExtra> & { id: string })[]) {
    g.server.db.transaction(() => {
      const stmt = g.server.db.prepare<{
        id: string
        chinese: string
      }>(/* sql */ `
        UPDATE [${this.tableName}]
        SET chinese = @chinese
        WHERE id = @id
      `)

      items.map((it) => {
        const stmtQ = g.server.db.prepare<{
          id: string
          chinese: string | null
          pinyin: string | null
          english: string | null
          type: string | null
          description: string | null
          tag: string | null
        }>(/* sql */ `
          UPDATE ${this.tableName}_q
          SET ${[
            it.chinese
              ? /* sql */ `
            chinese = jieba(@chinese),
            pinyin = COALESCE(
              @pinyin,
              to_pinyin(@chinese)
            )
            `
              : '',
            it.english !== null ? 'english = @english' : '',
            it.type !== null ? '[type] = @type' : '',
            it.description !== null ? '[description] = @description' : '',
            it.tag !== null ? 'tag = @tag' : ''
          ]
            .filter((s) => s)
            .join(',')}
          WHERE id = @id
        `)

        if (it.chinese) {
          stmt.run({
            id: it.id,
            chinese: it.chinese
          })
        }

        stmtQ.run({
          id: it.id,
          chinese: it.chinese || null,
          pinyin: it.pinyin || null,
          english: it.english || null,
          type: it.type ?? null,
          description: it.description ?? null,
          tag: it.tag ?? null
        })
      })
    })()
  }

  static delete(...ids: string[]) {
    if (ids.length < 1) {
      throw new Error('nothing to delete')
    }

    g.server.db
      .prepare(
        /* sql */ `
    DELETE FROM ${this.tableName}_q
    WHERE id IN (${Array(ids.length).fill('?')})
    `
      )
      .run(...ids)

    g.server.db
      .prepare(
        /* sql */ `
    DELETE FROM [${this.tableName}]
    WHERE id IN (${Array(ids.length).fill('?')})
    `
      )
      .run(...ids)
  }

  private constructor(public entry: Partial<IDbExtra> & { id: string }) {
    if (!entry.id) {
      throw new Error('No entry id')
    }
  }
}

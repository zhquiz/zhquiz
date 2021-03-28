import { ConnectionPool, sql } from '@databases/pg'

export async function populate(db: ConnectionPool) {
  await db.tx(async (db) => {
    {
      const tag = 'HSK6'
      const sets = 10
      const [{ count }] = await db.query(sql`
      SELECT COUNT(*) count
      FROM (
        SELECT DISTINCT "entry" FROM (
          SELECT entry, frequency
          FROM entry_tag et
          LEFT JOIN dict.cedict v ON v.simplified = et.entry
          WHERE tag &@ ${tag} AND "type" = 'vocabulary'
          ORDER BY frequency ASC NULLS FIRST
        ) t1
      ) t2
      `)

      const lotSize = Math.ceil(count / sets)
      for (let i = 0; i < sets; i++) {
        await db.query(sql`
        INSERT INTO "library" ("title", "entry", "type", "tag")
        SELECT
          ${`${tag} (Set ${sets - i}/${sets})`},
          (
            SELECT array_agg("entry")
            FROM (
              SELECT DISTINCT "entry" FROM (
                SELECT entry, frequency
                FROM entry_tag et
                LEFT JOIN dict.cedict v ON v.simplified = et.entry
                WHERE tag &@ ${tag} AND "type" = 'vocabulary'
                ORDER BY frequency ASC NULLS FIRST
              ) t1
              LIMIT ${lotSize} OFFSET ${i * lotSize}
            ) t2
          ),
          'vocabulary',
          ${['HSK', tag]}
        `)
      }
    }

    {
      const tag = 'HSK5'
      const sets = 6
      const [{ count }] = await db.query(sql`
      SELECT COUNT(*) count
      FROM (
        SELECT DISTINCT "entry" FROM (
          SELECT entry, frequency
          FROM entry_tag et
          LEFT JOIN dict.cedict v ON v.simplified = et.entry
          WHERE tag &@ ${tag} AND "type" = 'vocabulary'
          ORDER BY frequency ASC NULLS FIRST
        ) t1
      ) t2
      `)

      const lotSize = Math.ceil(count / sets)
      for (let i = 0; i < sets; i++) {
        await db.query(sql`
        INSERT INTO "library" ("title", "entry", "type", "tag")
        SELECT
          ${`${tag} (Set ${sets - i}/${sets})`},
          (
            SELECT array_agg("entry")
            FROM (
              SELECT DISTINCT "entry" FROM (
                SELECT entry, frequency
                FROM entry_tag et
                LEFT JOIN dict.cedict v ON v.simplified = et.entry
                WHERE tag &@ ${tag} AND "type" = 'vocabulary'
                ORDER BY frequency ASC NULLS FIRST
              ) t1
              LIMIT ${lotSize} OFFSET ${i * lotSize}
            ) t2
          ),
          'vocabulary',
          ${['HSK', tag]}
        `)
      }
    }

    {
      const tag = 'HSK4'
      const sets = 3
      const [{ count }] = await db.query(sql`
      SELECT COUNT(*) count
      FROM (
        SELECT DISTINCT "entry" FROM (
          SELECT entry, frequency
          FROM entry_tag et
          LEFT JOIN dict.cedict v ON v.simplified = et.entry
          WHERE tag &@ ${tag} AND "type" = 'vocabulary'
          ORDER BY frequency ASC NULLS FIRST
        ) t1
      ) t2
      `)

      const lotSize = Math.ceil(count / sets)
      for (let i = 0; i < sets; i++) {
        await db.query(sql`
        INSERT INTO "library" ("title", "entry", "type", "tag")
        SELECT
          ${`${tag} (Set ${sets - i}/${sets})`},
          (
            SELECT array_agg("entry")
            FROM (
              SELECT DISTINCT "entry" FROM (
                SELECT entry, frequency
                FROM entry_tag et
                LEFT JOIN dict.cedict v ON v.simplified = et.entry
                WHERE tag &@ ${tag} AND "type" = 'vocabulary'
                ORDER BY frequency ASC NULLS FIRST
              ) t1
              LIMIT ${lotSize} OFFSET ${i * lotSize}
            ) t2
          ),
          'vocabulary',
          ${['HSK', tag]}
        `)
      }
    }

    {
      const tag = 'HSK3'
      const sets = 2
      const [{ count }] = await db.query(sql`
      SELECT COUNT(*) count
      FROM (
        SELECT DISTINCT "entry" FROM (
          SELECT entry, frequency
          FROM entry_tag et
          LEFT JOIN dict.cedict v ON v.simplified = et.entry
          WHERE tag &@ ${tag} AND "type" = 'vocabulary'
          ORDER BY frequency ASC NULLS FIRST
        ) t1
      ) t2
      `)

      const lotSize = Math.ceil(count / sets)
      for (let i = 0; i < sets; i++) {
        await db.query(sql`
        INSERT INTO "library" ("title", "entry", "type", "tag")
        SELECT
          ${`${tag} (Set ${sets - i}/${sets})`},
          (
            SELECT array_agg("entry")
            FROM (
              SELECT DISTINCT "entry" FROM (
                SELECT entry, frequency
                FROM entry_tag et
                LEFT JOIN dict.cedict v ON v.simplified = et.entry
                WHERE tag &@ ${tag} AND "type" = 'vocabulary'
                ORDER BY frequency ASC NULLS FIRST
              ) t1
              LIMIT ${lotSize} OFFSET ${i * lotSize}
            ) t2
          ),
          'vocabulary',
          ${['HSK', tag]}
        `)
      }
    }

    {
      const tag = 'HSK2'

      await db.query(sql`
      INSERT INTO "library" ("title", "entry", "type", "tag")
      SELECT
        ${tag},
        (
          SELECT array_agg("entry")
          FROM (
            SELECT DISTINCT "entry" FROM (
              SELECT entry, frequency
              FROM entry_tag et
              LEFT JOIN dict.cedict v ON v.simplified = et.entry
              WHERE tag &@ ${tag} AND "type" = 'vocabulary'
              ORDER BY frequency ASC NULLS FIRST
            ) t1
          ) t2
        ),
        'vocabulary',
        ${['HSK', tag]}
      `)
    }

    {
      const tag = 'HSK1'

      await db.query(sql`
      INSERT INTO "library" ("title", "entry", "type", "tag")
      SELECT
        ${tag},
        (
          SELECT array_agg("entry")
          FROM (
            SELECT DISTINCT "entry" FROM (
              SELECT entry, frequency
              FROM entry_tag et
              LEFT JOIN dict.cedict v ON v.simplified = et.entry
              WHERE tag &@ ${tag} AND "type" = 'vocabulary'
              ORDER BY frequency ASC NULLS FIRST
            ) t1
          ) t2
        ),
        'vocabulary',
        ${['HSK', tag]}
      `)
    }
  })

  // await db.query(sql`
  //   REFRESH MATERIALIZED VIEW dict.entry_tag;
  // `)
}

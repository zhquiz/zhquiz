import XRegExp from 'xregexp'
import jieba from 'nodejieba'
import runes from 'runes2'
import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')
  const simpChars = new Set<string>(
    db
      .prepare(
        /* sql */ `
  SELECT [entry]
  FROM token
  WHERE hanzi_level <= 50
  `
      )
      .all()
      .map(({ entry }) => entry)
  )

  const entries: {
    chinese: string
    meta: {
      segments: string[]
    }
  }[] = db
    .prepare(
      /* sql */ `
  SELECT chinese FROM sentence
  `
    )
    .all()

  const stmtUpdate = db.prepare(/* sql */ `
  UPDATE sentence
  SET [level] = @level, meta = @meta
  WHERE chinese = @chinese
  `)

  const batchSize = 5000
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)

    const segments = new Set(
      batch.flatMap((it) => {
        const segments = jieba
          .cutForSearch(it.chinese)
          .filter((s) => XRegExp('\\p{Han}').test(s))

        it.meta = {
          segments
        }

        return segments
      })
    )

    const lvMap: Record<string, number> = db
      .prepare(
        /* sql */ `
    SELECT [entry], vocab_level [level]
    FROM token
    WHERE [entry] IN (${Array(segments.size).fill('?')})
    `
      )
      .all(...segments)
      .reduce(
        (prev, { entry, level }) => ({ ...prev, [entry]: level }),
        {} as Record<string, number>
      )

    db.transaction(() => {
      batch.map((it) => {
        const lvList = it.meta.segments.map((s) => lvMap[s])

        stmtUpdate.run({
          level:
            runes(it.chinese)
              .filter((s) => XRegExp('\\p{Han}').test(s))
              .every((s) => simpChars.has(s)) &&
            lvList.filter((lv) => lv).length
              ? (Math.max(...lvList.filter((lv) => lv)) * lvList.length) /
                lvList.filter((lv) => lv).length
              : null,
          meta: JSON.stringify(it.meta),
          chinese: it.chinese
        })
      })
    })()
  }

  db.close()
}

if (require.main === module) {
  main()
}

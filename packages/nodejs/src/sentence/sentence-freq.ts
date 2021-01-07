import axios from 'axios'
import jieba from 'nodejieba'
import sqlite from 'better-sqlite3'

async function main() {
  const db = sqlite('../../submodules/server/assets/zh.db')

  const entries: {
    chinese: string
    frequency?: number
    level?: number
    meta: {
      segments: Record<
        string,
        {
          level?: number
        }
      >
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
  SET frequency = @frequency, [level] = @level, meta = @meta
  WHERE chinese = @chinese
  `)

  const batchSize = 5000
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)

    const segments = new Set(
      batch.flatMap((it) => {
        it.meta = {
          segments: jieba
            .cutForSearch(it.chinese)
            .reduce(
              (prev, k) => ({ ...prev, [k]: {} }),
              {} as Record<string, {}>
            )
        }

        return Object.keys(it.meta.segments)
      })
    )

    const { data: fMap } = await axios.post<Record<string, number>>(
      'http://localhost:8000/wordfreq',
      batch.map((it) => it.chinese)
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
        Object.keys(it.meta.segments).map((k) => {
          it.meta.segments[k].level = lvMap[k]
        })

        const lvList = Object.values(it.meta.segments).map(
          ({ level }) => level!
        )

        it.level = lvList.filter((lv) => lv).length
          ? (Math.max(...lvList.filter((lv) => lv)) * lvList.length) /
            lvList.filter((lv) => lv).length
          : undefined

        stmtUpdate.run({
          frequency: fMap[it.chinese],
          level: it.level,
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

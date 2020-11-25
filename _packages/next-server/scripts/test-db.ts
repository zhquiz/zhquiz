import { initZh } from '../src/db/chinese'

async function main() {
  const zh = initZh('assets/zh.db')

  console.log(
    zh.db
      .prepare(
        /* sql */ `
  SELECT chinese, english
  FROM sentence s
  JOIN sentence_token st  ON st.sentence_id = s.id
  WHERE st.entry = @entry
  GROUP BY chinese
  LIMIT 10
  `
      )
      .all({ entry: '你们' })
  )

  zh.db.close()
}

if (require.main === module) {
  main().catch(console.error)
}

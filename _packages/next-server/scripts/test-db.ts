import { initZh } from '../src/db/chinese'

async function main() {
  const zh = initZh('assets/zh.db')

  // console.log(
  //   zh.db
  //     .prepare(
  //       /* sql */ `
  // SELECT chinese, english
  // FROM sentence s
  // JOIN sentence_token st  ON st.sentence_id = s.id
  // WHERE st.entry = @entry
  // GROUP BY chinese
  // LIMIT 10
  // `
  //     )
  //     .all({ entry: '你们' })
  // )

  console.log(
    zh.db
      .prepare(
        /* sql */ `
  SELECT
    [entry], pinyin, english, frequency,
    (
      SELECT group_concat(child, '') FROM token_sub WHERE parent = [entry] GROUP BY parent
    )   sub,
    (
      SELECT group_concat(child, '') FROM token_sup WHERE parent = [entry] GROUP BY parent
    )   sup,
    (
      SELECT group_concat(child, '') FROM token_var WHERE parent = [entry] GROUP BY parent
    )   [var]
  FROM token
  WHERE pinyin LIKE '%/%/%' AND english IS NOT NULL
  ORDER BY frequency ASC
  LIMIT 50
  `
      )
      .all()
  )

  zh.db.close()
}

if (require.main === module) {
  main().catch(console.error)
}

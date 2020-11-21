/* eslint-disable no-console */
import { zh, zhInit, zhVocab } from '@/db/local'

async function main() {
  await zhInit()

  const qs = ['到达', '麻烦']

  console.log(
    zhVocab.find({
      $or: [{ simplified: { $in: qs } }, { traditional: { $in: qs } }],
    })
  )

  zh.close()
}

if (require.main === module) {
  main()
}

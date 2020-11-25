import { initZh, zhSentence } from '../src/db/chinese'

async function main() {
  const zh = await initZh('assets/zh.loki')

  console.log(zhSentence.find({ english: { $fts: '你好' } as any }))

  zh.close()
}

if (require.main === module) {
  main().catch(console.error)
}

import { zh, zhInit, zhSentence } from '../src/db/local'

async function main() {
  await zhInit()

  const olRegex = /^\s*\d+\.\s*/g

  zhSentence.updateWhere(
    () => true,
    (el) => {
      if (olRegex.test(el.chinese)) {
        el.chinese = el.chinese.replace(olRegex, '')
      }

      if (el.english && olRegex.test(el.english)) {
        el.english = el.english.replace(olRegex, '')
      }

      return el
    }
  )

  zh.save(() => {
    zh.close()
  })
}

main().catch(console.error)

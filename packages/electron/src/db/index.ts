import toPinyin from 'chinese-to-pinyin'
import jieba from 'nodejieba'

import { g } from '../shared'
import { DbExtra } from './extra'
import { DbLibrary } from './library'
import { DbQuiz } from './quiz'
import { DbSentence } from './sentence'
import { DbUser } from './user'

export class Database {
  static init() {
    g.server.db.function('to_pinyin', (s: string) => {
      return toPinyin(s, { toneToNumber: true, keepRest: true })
    })

    g.server.db.function('jieba', (s: string) => {
      return jieba.cutForSearch(s).join(' ')
    })

    DbUser.init()
    DbExtra.init()
    DbLibrary.init()
    DbQuiz.init()
    DbSentence.init()
  }
}

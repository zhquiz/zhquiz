import FlexSearch from 'flexsearch'
import jieba from 'nodejieba'

export interface IZhEntry {
  id: number
  simplified: string
  traditional: string[]
  reading: string[]
  english: string[]
  tag: string[]
}

export const zh = FlexSearch.create<IZhEntry>({
  tokenize: (s) => {
    return jieba.cutForSearch(s).flatMap((s0) => s0.split(/[/\s]/g))
  },
  depth: 2
})

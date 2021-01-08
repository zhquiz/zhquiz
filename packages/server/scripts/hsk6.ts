import S from 'jsonschema-definer'
import fs from 'fs'
import yaml from 'js-yaml'

const schema = S.list(
  S.shape({
    title: S.string(),
    children: S.list(
      S.shape({
        title: S.string(),
        entries: S.list(S.string())
      })
    )
  })
)

const fourChars: string[] = []
const others: string[] = []

for (const it of schema
  .ensure(
    yaml.load(fs.readFileSync('../../assets/library.yaml', 'utf-8')) as any
  )
  .flatMap(({ children }) => {
    return children.map(({ title: t2, entries }) => {
      return {
        title: t2.split(' ')[0],
        entries
      }
    })
  })
  .filter(({ title }) => title === 'HSK6')
  .flatMap(({ entries }) => entries)) {
  if (it.length === 4) {
    fourChars.push(it)
  } else {
    others.push(it)
  }
}

for (let i = 0; i < others.length; i += 300) {
  console.log(yaml.dump(others.slice(i, i + 300), { flowLevel: 0 }))
}

console.log(yaml.dump(fourChars, { flowLevel: 0 }))

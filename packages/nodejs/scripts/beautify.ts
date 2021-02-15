import fs from 'fs'
import yaml from 'js-yaml'

async function main() {
  const data = yaml.load(fs.readFileSync('../../assets/vocab.yaml', 'utf-8'))

  fs.writeFileSync(
    '../../assets/vocab.yaml',
    yaml.dump(data, {
      flowLevel: 2,
      sortKeys: true
    })
  )
}

if (require.main === module) {
  main()
}

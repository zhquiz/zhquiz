import AdmZip from 'adm-zip'
import fs from 'fs'
import glob from 'fast-glob'

process.chdir('../../submodules/server')

glob.sync('./zhquiz-darwin-*').map((f) => {
  if (!f.endsWith('.app')) {
    fs.renameSync(f, f + '.app')
  }
})

glob.sync('./zhquiz-*').map((f) => {
  const zip = new AdmZip()
  zip.addLocalFolder('./assets', 'assets')
  zip.addLocalFolder('./public', 'public')
  zip.addLocalFile(`./${f}`)

  if (!fs.existsSync('../../dist')) {
    fs.mkdirSync('../../dist')
  }

  zip.writeZip(`../../dist/${f.replace(/\.[^.-]+$/, '')}.zip`)
})

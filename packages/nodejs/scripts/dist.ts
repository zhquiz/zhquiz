import AdmZip from 'adm-zip'
import fs from 'fs'
import os from 'os'
import { spawnSync } from 'child_process'

process.chdir('../../submodules/server')

spawnSync('yarn', {
  cwd: '../submodules/web',
  stdio: 'inherit'
})

spawnSync('yarn', ['build'], {
  cwd: '../submodules/web',
  stdio: 'inherit'
})

spawnSync('robo', ['build'], {
  stdio: 'inherit'
})

const platform = os.platform()

const zip = new AdmZip()
zip.addLocalFolder('./assets')
zip.addLocalFolder('./public')

let appName = 'zhquiz.app'
if (platform === 'win32') {
  const newAppName = 'zhquiz.exe'
  fs.copyFileSync(appName, newAppName)
  appName = newAppName
}
zip.addLocalFile(`./${appName}`)

if (!fs.existsSync('../../dist')) {
  fs.mkdirSync('../../dist')
}

zip.writeZip(`../../dist/zhquiz-${platform}.zip`)

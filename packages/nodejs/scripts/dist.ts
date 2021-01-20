import AdmZip from 'adm-zip'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import glob from 'fast-glob'

process.chdir('../../submodules/go-zhquiz')

execSync('rm -rf ../../dist')
fs.ensureDirSync('../../dist')

glob.sync('./zhquiz-*').map((f) => {
  if (/-darwin-/.test(f)) {
    fs.ensureDirSync(`../../dist/${f}.app/Contents/MacOS`)

    fs.writeFileSync(
      `../../dist/${f}.app/Contents/Info.plist`,
      `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${f}</string>
  <key>CFBundleIconFile</key>
  <string>favicon.icns</string>
  <key>CFBundleIdentifier</key>
  <string>cc.zhquiz.${f}</string>

  <!-- avoid having a blurry icon and text -->
  <key>NSHighResolutionCapable</key>
  <string>True</string>

  <!-- avoid showing the app on the Dock -->
  <key>LSUIElement</key>
  <string>1</string>
</dict>
</plist>
    `.trim()
    )

    fs.ensureDirSync(`../../dist/${f}.app/Contents/Resources`)

    fs.copySync('./assets', `../../dist/${f}.app/Contents/MacOS/assets`)
    fs.copySync('./public', `../../dist/${f}.app/Contents/MacOS/public`)
    fs.copyFileSync(
      './public/favicon.icns',
      `../../dist/${f}.app/Contents/Resources/favicon.icns`
    )
    fs.copyFileSync(f, `../../dist/${f}.app/Contents/MacOS/${f}`)

    const zip = new AdmZip()
    zip.addLocalFolder(`../../dist/${f}.app`, `${f}.app`)

    zip.writeZip(`../../dist/${f}.zip`)
  } else {
    const zip = new AdmZip()
    zip.addLocalFolder('./assets', 'assets')
    zip.addLocalFolder('./public', 'public')
    zip.addLocalFile(`./${f}`)

    zip.writeZip(`../../dist/${f.replace(/\.[^.-]+$/, '')}.zip`)
  }
})

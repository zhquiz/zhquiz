const fs = require('fs-extra')
const glob = require('fast-glob')
const path = require('path')

/**
 *
 * @param {import('electron-builder').AfterPackContext} ctx
 */
exports.default = async function (ctx) {
  let xgoPlatform = ctx.electronPlatformName
  if (xgoPlatform.startsWith('win')) {
    xgoPlatform = 'windows'
  }
  const resourceDir = ctx.packager.getResourcesDir(ctx.appOutDir)
  console.log(resourceDir)

  fs.ensureDirSync(path.join(resourceDir, 'server'))
  fs.copySync(
    '../../submodules/go-zhquiz/assets',
    path.join(resourceDir, 'server', 'assets')
  )

  fs.copyFileSync(
    glob.sync(`../../submodules/go-zhquiz/zhquiz-${xgoPlatform}-*`)[0],
    path.join(resourceDir, 'server', 'go-zhquiz')
  )
}

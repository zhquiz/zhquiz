import path from 'path'

import { BrowserWindow, app, protocol } from 'electron'
import contextMenu from 'electron-context-menu'
import getPort from 'get-port'

import { Server } from './server'

contextMenu()

let server: Server | null = null
let win: BrowserWindow | null = null

async function initServer() {
  server = await Server.init({
    port: await getPort(),
    userDataDir: app.getPath('userData'),
    assetsDir: getAsarUnpackedPath('assets')
  })

  if (win && !win.webContents.getURL().startsWith('app://')) {
    win.loadURL('app://./random')
  }

  app.once('before-quit', () => {
    if (server) {
      server.cleanup()
      server = null
    }
  })
}
initServer()

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false
    }
  })
  win.maximize()

  if (server) {
    win.loadURL('app://./random')
  } else {
    win.loadFile('public/loading/index.html')
  }

  win.on('close', () => {
    if (win) {
      win.webContents.send('app-close')
      win = null
    }
  })
}

app.whenReady().then(() => {
  const isRegistered = protocol.registerHttpProtocol('app', (req, cb) => {
    if (server) {
      const { uploadData, ...res } = req
      cb({
        ...res,
        url: req.url.replace(
          /^app:\/\/[^/]+/,
          `http://localhost:${server.port}`
        )
      })
    }
  })

  if (!isRegistered) {
    console.error('protocol registration failed')
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function getAsarUnpackedPath(...ps: string[]) {
  if (!app.isPackaged) {
    return path.join(__dirname, '..', ...ps)
  } else {
    let asarUnpackedPath = __dirname.replace(
      /\.asar([\\/])/,
      '.asar.unpacked$1'
    )
    return path.join(asarUnpackedPath, '..', ...ps)
  }
}

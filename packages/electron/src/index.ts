import http from 'http'
import stream from 'stream'

import { BrowserWindow, app, protocol } from 'electron'
import getPort from 'get-port'

import { Server } from './server'

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })
  win.maximize()
  win.loadFile('public/loading/index.html')

  const regis = protocol.registerHttpProtocol('app', async () => {
    try {
      const server = await Server.init({
        port: await getPort(),
        userDataDir: app.getPath('userData')
      })

      app.once('before-quit', () => {
        server.cleanup()
      })

      protocol.interceptHttpProtocol('app', (req, cb) => {
        const { uploadData, ...res } = req
        const s = new stream.Duplex()

        const httpRequest = http.request(
          {
            ...req,
            host: 'localhost',
            port: server.port,
            path: req.url.replace('app://.', '')
          },
          (res) => {
            res.pipe(s)
          }
        )

        httpRequest.once('error', (err) => {
          server.logger.error(err.name, err.message)

          cb({
            ...res,
            error: 500
          })
        })

        httpRequest.end(() => {
          cb({
            ...res,
            data: s
          })
        })
      })

      win.loadURL('app://./random')
    } catch (e) {
      throw e
    }
  })

  if (!regis) {
    win.loadURL('app://./random')
  }
}

app.whenReady().then(() => {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { bypassCSP: true } }
  ])

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

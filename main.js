/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @main js entry
 */

const { app, BrowserWindow } = require('electron')
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1000, height: 800 })
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools
  mainWindow.webContents.openDevTools()
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

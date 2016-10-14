/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @main js entry
 */

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const dialog = electron.dialog
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1000, height: 800 })
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools
  // mainWindow.webContents.openDevTools()
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ready
app.on('ready', createWindow)

// close
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// active
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// ipc
ipcMain.on('dev', (e) => {
  e.sender.send('devReply', process.argv)
})
ipcMain.on('msg', (e, arg) => {
  // console.log(e)
  dialog.showErrorBox('Tips', arg)
})
ipcMain.on('openFile', (e) => {
  dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON file', extensions: ['json'] }],
    properties: ['openFile'],
  }, (filename) => {
    e.sender.send('openFileReply', filename)
  })
})
ipcMain.on('saveFile', (e) => {
  dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'JSON file', extensions: ['json'] }],
  }, (filename) => {
    e.sender.send('saveFileReply', filename)
  })
})

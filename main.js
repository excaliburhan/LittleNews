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
ipcMain.on('dialog', (e, arg) => {
  if (arg === 'import') {
    dialog.showOpenDialog(mainWindow, {
      filters: [{
        name: 'JSON file',
        extensions: ['json'],
      }],
      properties: ['openFile'],
    }, (filenames) => {
      filenames && e.sender.send('dialogReply', ['import', filenames[0]])
    })
  } else if (arg === 'export') {
    dialog.showSaveDialog(mainWindow, {
      filters: [{
        name: 'JSON file',
        extensions: ['json'],
      }],
    }, (filename) => {
      filename && e.sender.send('dialogReply', ['export', filename])
    })
  }
})
ipcMain.on('BrowserWindow', (e, arg) => {
  if (arg === 'maximize') {
    mainWindow.maximize()
  }
})

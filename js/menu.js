/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @menu
 */

const electron = require('electron')
const remote = electron.remote
const shell = electron.shell
const ipcRenderer = electron.ipcRenderer

let template = []
let fullScreenKey
let toggleDevKey

if (process.platform === 'darwin') {
  fullScreenKey = 'Ctrl+Command+F'
} else {
  fullScreenKey = 'F11'
}
if (process.platform === 'darwin') {
  toggleDevKey = 'Alt+Command+I'
} else {
  toggleDevKey = 'Ctrl+Shift+I'
}

ipcRenderer.on('devReply', (e, arg) => {
  // console.log(e)
  if (arg.slice(2).length) {
    template.push({
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload()
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: toggleDevKey,
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.toggleDevTools()
          },
        },
      ],
    })
  }
  const Menu = remote.Menu
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

module.exports = {
  initMenu() {
    template = [
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Import Config File',
            accelerator: 'CmdOrCtrl+I',
            click: () => {
              ipcRenderer.send('dialog', 'import')
            },
          },
          {
            label: 'Export Config File',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              ipcRenderer.send('dialog', 'export')
            },
          },
          { type: 'separator' },
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          },
          {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo',
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall',
          },
        ],
      },
      {
        label: 'Window',
        role: 'window',
        submenu: [
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close',
          },
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize',
          },
          {
            label: 'Toggle Maximize',
            accelerator: 'Shift+CmdOrCtrl+M',
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                if (focusedWindow.isMaximized()) {
                  focusedWindow.unmaximize()
                } else {
                  focusedWindow.maximize()
                }
              }
            },
          },
          {
            label: 'Toggle Full Screen',
            accelerator: fullScreenKey,
            click: (item, focusedWindow) => {
              if (focusedWindow) focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            },
          },
          { type: 'separator' },
          {
            label: 'Bring All to Front',
            role: 'front',
          },
        ],
      },
      {
        label: 'Help',
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: () => {
              shell.openExternal('https://github.com/excaliburhan/LittleNews')
            },
          },
        ],
      },
    ]

    if (process.platform === 'darwin') {
      const app = remote.app
      const name = app.getName()
      template.unshift({
        label: name,
        submenu: [
          {
            label: `About ${name}`,
            role: 'about',
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
            submenu: [],
          },
          { type: 'separator' },
          {
            label: `Hide ${name}`,
            accelerator: 'Command+H',
            role: 'hide',
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers',
          },
          {
            label: 'Show All',
            role: 'unhide',
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => {
              app.quit()
            },
          },
        ],
      })
    }

    ipcRenderer.send('dev')
  },
}

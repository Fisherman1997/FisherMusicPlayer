import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function bootstrap(mainWindow: BrowserWindow): void {
    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('isMaximized_win', true)
    })
    // 监听窗口解除最大化事件
    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('isMaximized_win', false)
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    ipcMain.handle('isMaximized', () => {
        return mainWindow.isMaximized()
    })
}

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })
    bootstrap(mainWindow)
    import('./ipcMainAll')
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron_fishermusicplayer')

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

import { ipcMain, session, BrowserWindow } from 'electron'
import { constructServer } from './api/startApi'
import { controlWindowType } from '../types/mainType'

const controlWindow = (action: controlWindowType) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
        switch (action) {
            case 'close':
                win.close()
                break
            case 'show':
                win.show()
                break
            case 'hide':
                win.hide()
                break
            case 'restore':
                win.restore()
                break
            case 'maximize':
                win.maximize()
                break
            case 'minimize':
                win.minimize()
                break
            case 'unmaximize':
                win.unmaximize()
                break
        }
    }
}

ipcMain.on('close', () => controlWindow('close'))
ipcMain.on('show', () => controlWindow('show'))
ipcMain.on('hide', () => controlWindow('hide'))
ipcMain.on('restore', () => controlWindow('restore'))
ipcMain.on('maximize', () => controlWindow('maximize'))
ipcMain.on('minimize', () => controlWindow('minimize'))
ipcMain.on('unmaximize', () => controlWindow('unmaximize'))

ipcMain.handle('request', async (_ev, { route, query, body, files }) => {
    const cookie = await session.defaultSession.cookies.get({})
    try {
        return await constructServer(route, {
            query,
            cookie: [...cookie],
            body,
            files
        })
    } catch (err) {
        return err
    }
})

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { controlWindowType } from '../types/mainType'

type requestParams = {
    query?: object
    body?: object
    files?: Buffer[]
}
interface apiType {
    request: (route: string, { query, body, files }: requestParams) => Promise<object>
    changeWindow: (type: controlWindowType) => void
    getIsMaximized: () => Promise<boolean>
}

// Custom APIs for renderer
const api: apiType = {
    request: async (route: string, { query = {}, body = {}, files }) => {
        return await ipcRenderer.invoke('request', { route, query, body, files })
    },
    changeWindow: (type: controlWindowType) => {
        ipcRenderer.send(type)
    },
    getIsMaximized: () => ipcRenderer.invoke('isMaximized').then((res: boolean) => res)
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}

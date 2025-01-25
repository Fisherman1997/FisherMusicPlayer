import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { controlWindowType } from '../types/mainType'
import { apiType, requestParams } from '../types/preloadType'
import { RequestResponse } from '../types/requestResponse'

// Custom APIs for renderer
const api: apiType = {
    request: async <T>(
        route: string,
        { query = {}, body = {}, files }: requestParams
    ): Promise<RequestResponse<T>> => {
        return (await ipcRenderer.invoke('request', {
            route,
            query,
            body,
            files
        })) as RequestResponse<T>
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

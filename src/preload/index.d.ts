import { ElectronAPI } from '@electron-toolkit/preload'
import { controlWindowType } from "../types/mainType";


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
declare global {
    interface Window {
        electron: ElectronAPI
        api: apiType
    }
}

import { ElectronAPI } from '@electron-toolkit/preload'
import { controlWindowType } from "../types/mainType"
import { apiType } from '../types/preloadType'


declare global {
    interface Window {
        electron: ElectronAPI
        api: apiType
    }
}

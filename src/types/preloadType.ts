import { controlWindowType } from './mainType'

export type requestParams = {
    query?: object
    body?: object
    files?: Buffer[]
}
export interface apiType {
    request: (route: string, { query, body, files }: requestParams) => Promise<object>
    changeWindow: (type: controlWindowType) => void
    getIsMaximized: () => Promise<boolean>
}

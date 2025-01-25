import { controlWindowType } from './mainType'
import { RequestResponse } from './requestResponse'

export type requestParams = {
    query?: object
    body?: object
    files?: Buffer[]
}
export interface apiType {
    request: <T>(
        route: string,
        { query, body, files }: requestParams
    ) => Promise<RequestResponse<T>>
    changeWindow: (type: controlWindowType) => void
    getIsMaximized: () => Promise<boolean>
}

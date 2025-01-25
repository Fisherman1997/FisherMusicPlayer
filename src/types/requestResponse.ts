export interface ResponseBody<T> {
    category: number
    code: number
    result: T | never
}

export interface RequestResponse<T> {
    status: number
    body: ResponseBody<T>
    cookie: string[]
}

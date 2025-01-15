type module = {
    identifier: string
    route: string
    module: (query: object, request: (...params) => Promise<unknown>) => Promise<object>
}
const modules: module[]
export default modules

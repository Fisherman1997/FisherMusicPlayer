export function toBoolean(val) {
    if (typeof val === 'boolean') return val
    if (val === '') return val
    return val === 'true' || val == '1'
}
export function cookieToJson(cookie) {
    if (!cookie) return {}
    const cookieArr = cookie.split(';')
    const obj = {}
    cookieArr.forEach((i) => {
        const arr = i.split('=')
        obj[arr[0]] = arr[1]
    })
    return obj
}
export function getRandom(num) {
    const random = Math.floor(
        (Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, num - 1)
    )
    return random
}

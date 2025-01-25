import { requestMethodType } from '../../../types/mainType'
import { RequestResponse } from '../../../types/requestResponse'

interface RequestOptions {
    ua?: 'mobile' | 'pc' | false | string
    headers?: Record<string, string>
    realIP?: string
    ip?: string
    cookie?: Record<string, string> | string
    crypto?: 'weapi' | 'linuxapi' | 'eapi'
    proxy?: string
    url?: string
}

/**
 * 创建一个 HTTP 请求
 * @param method HTTP 方法 (GET, POST, etc.)
 * @param url 请求的 URL
 * @param data 请求的数据
 * @param options 请求的配置选项
 * @returns 返回一个包含状态码、响应体和 cookie 的对象
 */
export default function createRequest(
    method: requestMethodType,
    url: string,
    data?: Record<string, never>,
    options?: RequestOptions
): Promise<RequestResponse>

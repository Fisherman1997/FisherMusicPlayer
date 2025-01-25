import encrypt from './crypto'
import crypto from 'crypto'
import axios from 'axios'
import { PacProxyAgent } from 'pac-proxy-agent'
import http from 'http'
import https from 'https'
import tunnel from 'tunnel'
import { URL, URLSearchParams } from 'url'

const userAgentList = {
    mobile: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML like Gecko) Mobile/14A456 QQ/6.5.7.408 V1_IPH_SQ_6.5.7_1_APP_A Pixel/750 Core/UIWebView NetType/4G Mem/103',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.15(0x17000f27) NetType/WIFI Language/zh',
        'Mozilla/5.0 (Linux; Android 9; PCT-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.64 HuaweiBrowser/10.0.3.311 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; U; Android 9; zh-cn; Redmi Note 8 Build/PKQ1.190616.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/71.0.3578.141 Mobile Safari/537.36 XiaoMi/MiuiBrowser/12.5.22',
        'Mozilla/5.0 (Linux; Android 10; YAL-AL00 Build/HUAWEIYAL-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.62 XWEB/2581 MMWEBSDK/200801 Mobile Safari/537.36 MMWEBID/3027 MicroMessenger/7.0.18.1740(0x27001235) Process/toolsmp WeChat/arm64 NetType/WIFI Language/zh_CN ABI/arm64',
        'Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BKK-AL10 Build/HONORBKK-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/10.6 Mobile Safari/537.36'
    ],
    pc: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:80.0) Gecko/20100101 Firefox/80.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.30 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:80.0) Gecko/20100101 Firefox/80.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.30 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586'
    ]
}

const chooseUserAgent = (ua = false) => {
    const realUserAgentList = userAgentList[ua] || [...userAgentList.mobile, ...userAgentList.pc]
    return ['mobile', 'pc', false].includes(ua)
        ? realUserAgentList[Math.floor(Math.random() * realUserAgentList.length)]
        : ua
}

const createRequest = async (method, url, data = {}, options = {}) => {
    const headers = {
        'User-Agent': chooseUserAgent(options.ua),
        ...options.headers
    }

    if (method.toUpperCase() === 'POST')
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    if (url.includes('music.163.com')) headers['Referer'] = 'https://music.163.com'

    const ip = options.realIP || options.ip || ''
    if (ip) {
        headers['X-Real-IP'] = ip
        headers['X-Forwarded-For'] = ip
    }

    if (typeof options.cookie === 'object') {
        options.cookie = {
            __remember_me: true,
            _ntes_nuid: crypto.randomBytes(16).toString('hex'),
            ...options.cookie
        }

        if (url.indexOf('login') === -1) {
            options.cookie['NMTID'] = crypto.randomBytes(16).toString('hex')
        }

        if (!options.cookie.MUSIC_U && !options.cookie.MUSIC_A) {
            options.cookie.MUSIC_A = (Math.random() * 123456).toString()
        }

        headers['Cookie'] = Object.entries(options.cookie)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('; ')
    } else {
        headers['Cookie'] = options.cookie || '__remember_me=true; NMTID=xxx'
    }

    if (options.crypto === 'weapi') {
        headers['User-Agent'] =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.69'
        const csrfToken = (headers['Cookie'] || '').match(/_csrf=([^(;|$)]+)/)
        data.csrf_token = csrfToken ? csrfToken[1] : ''
        data = encrypt.weapi(data)
        url = url.replace(/\w*api/, 'weapi')
    } else if (options.crypto === 'linuxapi') {
        data = encrypt.linuxapi({
            method,
            url: url.replace(/\w*api/, 'api'),
            params: data
        })
        headers['User-Agent'] =
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
        url = 'https://music.163.com/api/linux/forward'
    } else if (options.crypto === 'eapi') {
        const cookie = options.cookie || {}
        const csrfToken = cookie['__csrf'] || ''
        const header = {
            osver: cookie.osver,
            deviceId: cookie.deviceId,
            appver: cookie.appver || '8.9.70',
            versioncode: cookie.versioncode || '140',
            mobilename: cookie.mobilename,
            buildver: cookie.buildver || Date.now().toString().substr(0, 10),
            resolution: cookie.resolution || '1920x1080',
            __csrf: csrfToken,
            os: cookie.os || 'android',
            channel: cookie.channel,
            requestId: `${Date.now()}_${Math.floor(Math.random() * 1000)
                .toString()
                .padStart(4, '0')}`
        }

        if (cookie.MUSIC_U) header['MUSIC_U'] = cookie.MUSIC_U
        if (cookie.MUSIC_A) header['MUSIC_A'] = cookie.MUSIC_A

        headers['Cookie'] = Object.entries(header)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('; ')

        data.header = header
        data = encrypt.eapi(options.url, data)
        url = url.replace(/\w*api/, 'eapi')
    }

    const settings = {
        method,
        url,
        headers,
        data: new URLSearchParams(data).toString(),
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true }),
        proxy: false
    }

    if (options.proxy) {
        if (options.proxy.includes('pac')) {
            settings.httpAgent = new PacProxyAgent(options.proxy)
            settings.httpsAgent = new PacProxyAgent(options.proxy)
        } else {
            const purl = new URL(options.proxy)
            if (purl.hostname) {
                const agent = tunnel[purl.protocol === 'https:' ? 'httpsOverHttp' : 'httpOverHttp'](
                    {
                        proxy: {
                            host: purl.hostname,
                            port: purl.port || 80,
                            proxyAuth:
                                purl.username && purl.password
                                    ? `${purl.username}:${purl.password}`
                                    : ''
                        }
                    }
                )
                settings.httpsAgent = agent
                settings.httpAgent = agent
            } else {
                console.error('代理配置无效,不使用代理')
            }
        }
    }

    if (options.crypto === 'eapi') {
        settings.responseType = 'arraybuffer'
    }

    try {
        const res = await axios(settings)
        const answer = {
            status: res.status,
            body: res.data,
            cookie: (res.headers['set-cookie'] || []).map((x) =>
                x.replace(/\s*Domain=[^(;|$)]+;*/, '')
            )
        }

        if (options.crypto === 'eapi') {
            answer.body = JSON.parse(encrypt.decrypt(answer.body).toString())
        }

        if (answer.body.code) {
            answer.body.code = Number(answer.body.code)
        }

        answer.status = Number(answer.body.code || res.status)
        if ([201, 302, 400, 502, 800, 801, 802, 803].includes(answer.body.code)) {
            answer.status = 200
        }

        answer.status = answer.status > 100 && answer.status < 600 ? answer.status : 400
        if (answer.status === 200) return answer
        throw answer
    } catch (err) {
        throw {
            status: 502,
            body: { code: 502, msg: err },
            cookie: []
        }
    }
}

export default createRequest

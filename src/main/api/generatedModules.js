import uploadPlugin from './plugins/upload.js'
import * as mm from 'music-metadata'
import md5 from 'md5'
import QRCode from 'qrcode'
import axios from 'axios'
import crypto from 'crypto'
import xml2js from 'xml2js'
import { resourceTypeMap } from './util/config.js'
import { toBoolean } from './util/index.js'

const parser = new xml2js.Parser(/* options */)
const pkg = {
    version: '1.0.0'
}
// Generates a UUID-like key
function createDupkey() {
    const hexDigits = '0123456789abcdef'
    const s = Array.from({ length: 36 }, (_, i) => {
        if (i === 14) return '4' // bits 12-15 of the time_hi_and_version field to 0010
        if (i === 19) return hexDigits[((Math.random() * 0x10) & 0x3) | 0x8] // bits 6-7 of the clock_seq_hi_and_reserved to 01
        if ([8, 13, 18, 23].includes(i)) return '-'
        return hexDigits[Math.floor(Math.random() * 0x10)]
    })
    return s.join('')
}

const ID_XOR_KEY_1 = Buffer.from('3go8&$833h0k(2)2')

// Encodes an ID using XOR and MD5
function cloudmusic_dll_encode_id(some_id) {
    const xored = Buffer.from(
        [...some_id].map((c, idx) => c.charCodeAt(0) ^ ID_XOR_KEY_1[idx % ID_XOR_KEY_1.length])
    )
    return crypto.createHash('md5').update(xored).digest('base64')
}

const typeMap = {
    new: 0,
    hot: 1
}

// Generates a random alphanumeric string of the given length
function createRandomString(len) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(
        ''
    )
}

const modules = [
    {
        identifier: 'yunbei_today',

        route: '/yunbei/today',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/point/today/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_task_finish',

        route: '/yunbei/task/finish',

        module: (query, request) => {
            const data = {
                userTaskId: query.userTaskId,
                depositCode: query.depositCode || '0'
            }
            return request('POST', `https://music.163.com/api/usertool/task/point/receive`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_tasks_todo',

        route: '/yunbei/tasks/todo',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/usertool/task/todo/query`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_tasks',

        route: '/yunbei/tasks',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/usertool/task/list/all`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_sign',

        route: '/yunbei/sign',

        module: (query, request) => {
            const data = {
                type: '0'
            }
            return request('POST', `https://music.163.com/api/point/dailyTask`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_receipt',

        route: '/yunbei/receipt',

        module: (query, request) => {
            const data = {
                limit: query.limit || 10,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/store/api/point/receipt`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_rcmd_song_history',

        route: '/yunbei/rcmd/song/history',

        module: (query, request) => {
            const data = {
                page: JSON.stringify({
                    size: query.size || 20,
                    cursor: query.cursor || ''
                })
            }
            return request(
                'POST',
                `https://music.163.com/weapi/yunbei/rcmd/song/history/list`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'yunbei_rcmd_song',

        route: '/yunbei/rcmd/song',

        module: (query, request) => {
            const data = {
                songId: query.id,
                reason: query.reason || '好歌献给你',
                scene: '',
                fromUserId: -1,
                yunbeiNum: query.yunbeiNum || 10
            }
            return request('POST', `https://music.163.com/weapi/yunbei/rcmd/song/submit`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_info',

        route: '/yunbei/info',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/v1/user/info`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei_expense',

        route: '/yunbei/expense',

        module: (query, request) => {
            const data = {
                limit: query.limit || 10,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/store/api/point/expense`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'yunbei',

        route: '/yunbei',

        module: (query, request) => {
            const data = {}
            // /api/point/today/get
            return request('POST', `https://music.163.com/api/point/signed/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'weblog',

        route: '/weblog',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/feedback/weblog`,
                query.data || {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'voice_upload',

        route: '/voice/upload',

        module: async (query, request) => {
            let ext = 'mp3'
            if (query.songFile.name.indexOf('flac') > -1) {
                ext = 'flac'
            }
            const filename =
                query.songName ||
                query.songFile.name
                    .replace('.' + ext, '')
                    .replace(/\s/g, '')
                    .replace(/\./g, '_')
            // query.cookie.os = 'pc'
            // query.cookie.appver = '2.9.7'
            if (!query.songFile) {
                return Promise.reject({
                    status: 500,
                    body: {
                        msg: '请上传音频文件',
                        code: 500
                    }
                })
            }

            const tokenRes = await request(
                'POST',
                `https://music.163.com/weapi/nos/token/alloc`,
                {
                    bucket: 'ymusic',
                    ext: ext,
                    filename: filename,
                    local: false,
                    nos_product: 0,
                    type: 'other'
                },
                { crypto: 'weapi', cookie: query.cookie, proxy: query.proxy }
            )

            const objectKey = tokenRes.body.result.objectKey.replace('/', '%2F')
            const docId = tokenRes.body.result.docId
            const res = await axios({
                method: 'post',
                url: `https://ymusic.nos-hz.163yun.com/${objectKey}?uploads`,
                headers: {
                    'x-nos-token': tokenRes.body.result.token,
                    'X-Nos-Meta-Content-Type': 'audio/mpeg'
                },
                data: null
            })
            // return xml
            const res2 = await parser.parseStringPromise(res.data)

            const res3 = await axios({
                method: 'put',
                url: `https://ymusic.nos-hz.163yun.com/${objectKey}?partNumber=1&uploadId=${res2.InitiateMultipartUploadResult.UploadId[0]}`,
                headers: {
                    'x-nos-token': tokenRes.body.result.token,
                    'Content-Type': 'audio/mpeg'
                },
                data: query.songFile.data
            })

            // get etag
            const etag = res3.headers.etag

            // 文件处理
            await axios({
                method: 'post',
                url: `https://ymusic.nos-hz.163yun.com/${objectKey}?uploadId=${res2.InitiateMultipartUploadResult.UploadId[0]}`,
                headers: {
                    'Content-Type': 'text/plain;charset=UTF-8',
                    'X-Nos-Meta-Content-Type': 'audio/mpeg',
                    'x-nos-token': tokenRes.body.result.token
                },
                data: `
   1${etag}
   `
            })

            // preCheck
            await request(
                'post',
                `https://interface.music.163.com/weapi/voice/workbench/voice/batch/upload/preCheck`,
                {
                    dupkey: createDupkey(),
                    voiceData: JSON.stringify([
                        {
                            name: filename,
                            autoPublish: query.autoPublish == 1 ? true : false,
                            autoPublishText: query.autoPublishText || '',
                            description: query.description,
                            voiceListId: query.voiceListId,
                            coverImgId: query.coverImgId,
                            dfsId: docId,
                            categoryId: query.categoryId,
                            secondCategoryId: query.secondCategoryId,
                            composedSongs: query.composedSongs
                                ? query.composedSongs.split(',')
                                : [],
                            privacy: query.privacy == 1 ? true : false,
                            publishTime: query.publishTime || 0,
                            orderNo: query.orderNo || 1
                        }
                    ])
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    headers: {
                        'x-nos-token': tokenRes.body.result.token
                    }
                }
            )
            const result = await request(
                'post',
                `https://interface.music.163.com/weapi/voice/workbench/voice/batch/upload/v2`,
                {
                    dupkey: createDupkey(),
                    voiceData: JSON.stringify([
                        {
                            name: filename,
                            autoPublish: query.autoPublish == 1 ? true : false,
                            autoPublishText: query.autoPublishText || '',
                            description: query.description,
                            voiceListId: query.voiceListId,
                            coverImgId: query.coverImgId,
                            dfsId: docId,
                            categoryId: query.categoryId,
                            secondCategoryId: query.secondCategoryId,
                            composedSongs: query.composedSongs
                                ? query.composedSongs.split(',')
                                : [],
                            privacy: query.privacy == 1 ? true : false,
                            publishTime: query.publishTime || 0,
                            orderNo: query.orderNo || 1
                        }
                    ])
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    headers: {
                        'x-nos-token': tokenRes.body.result.token
                    }
                }
            )
            return {
                status: 200,
                body: {
                    code: 200,
                    data: result.body.data
                }
            }
        }
    },

    {
        identifier: 'voice_detail',

        route: '/voice/detail',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request(
                'POST',
                `https://interface.music.163.com/weapi/voice/workbench/voice/detail`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'voicelist_search',

        route: '/voicelist/search',

        module: (query, request) => {
            const data = {
                fee: '-1',
                limit: query.limit || '200',
                offset: query.offset || '0',
                podcastName: query.podcastName || ''
            }
            return request(
                'POST',
                `https://interface.music.163.com/weapi/voice/workbench/voicelist/search`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'voicelist_list',

        route: '/voicelist/list',

        module: (query, request) => {
            const data = {
                limit: query.limit || '200',
                offset: query.offset || '0',
                voiceListId: query.voiceListId
            }
            return request(
                'POST',
                `https://interface.music.163.com/weapi/voice/workbench/voices/by/voicelist`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_timemachine',

        route: '/vip/timemachine',

        module: (query, request) => {
            const data = {}
            if (query.startTime && query.endTime) {
                data.startTime = query.startTime
                data.endTime = query.endTime
                data.type = 1
                data.limit = query.limit || 60
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipmusic/newrecord/weekflow`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_tasks',

        route: '/vip/tasks',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/weapi/vipnewcenter/app/level/task/list`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_info_v2',

        route: '/vip/info/v2',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/api/music-vip-membership/client/vip/info`,
                {
                    userId: query.uid || ''
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_info',

        route: '/vip/info',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/music-vip-membership/front/vip/info`,
                {
                    userId: query.uid || ''
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_growthpoint_get',

        route: '/vip/growthpoint/get',

        module: (query, request) => {
            const data = {
                taskIds: query.ids
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipnewcenter/app/level/task/reward/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_growthpoint_details',

        route: '/vip/growthpoint/details',

        module: (query, request) => {
            const data = {
                limit: query.limit || 20,
                offset: query.offset || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipnewcenter/app/level/growth/details`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'vip_growthpoint',

        route: '/vip/growthpoint',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/weapi/vipnewcenter/app/level/growhpoint/basic`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'video_url',

        route: '/video/url',

        module: (query, request) => {
            const data = {
                ids: '["' + query.id + '"]',
                resolution: query.res || 1080
            }
            return request('POST', `https://music.163.com/weapi/cloudvideo/playurl`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'video_timeline_recommend',

        route: '/video/timeline/recommend',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                filterLives: '[]',
                withProgramInfo: 'true',
                needUrl: '1',
                resolution: '480'
            }
            return request('POST', `https://music.163.com/api/videotimeline/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'video_timeline_all',

        route: '/video/timeline/all',

        module: (query, request) => {
            const data = {
                groupId: 0,
                offset: query.offset || 0,
                need_preview_url: 'true',
                total: true
            }
            // /api/videotimeline/otherclient/get
            return request(
                'POST',
                `https://music.163.com/api/videotimeline/otherclient/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'video_sub',

        route: '/video/sub',

        module: (query, request) => {
            query.t = query.t == 1 ? 'sub' : 'unsub'
            const data = {
                id: query.id
            }
            return request(
                'POST',
                `https://music.163.com/weapi/cloudvideo/video/${query.t}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'video_group_list',

        route: '/video/group/list',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/cloudvideo/group/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'video_group',

        route: '/video/group',

        module: (query, request) => {
            const data = {
                groupId: query.id,
                offset: query.offset || 0,
                need_preview_url: 'true',
                total: true
            }
            return request(
                'POST',
                `https://music.163.com/api/videotimeline/videogroup/otherclient/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'video_detail_info',

        route: '/video/detail/info',

        module: (query, request) => {
            const data = {
                threadid: `R_VI_62_${query.vid}`,
                composeliked: true
            }
            return request('POST', `https://music.163.com/api/comment/commentthread/info`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'video_detail',

        route: '/video/detail',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/weapi/cloudvideo/v1/video/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'video_category_list',

        route: '/video/category/list',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                total: 'true',
                limit: query.limit || 99
            }
            return request('POST', `https://music.163.com/api/cloudvideo/category/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'verify_qrcodestatus',

        route: '/verify/qrcodestatus',

        module: async (query, request) => {
            const data = {
                qrCode: query.qr
            }
            const res = await request(
                'POST',
                `https://music.163.com/weapi/frontrisk/verify/qrcodestatus`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            return res
        }
    },

    {
        identifier: 'verify_getQr',

        route: '/verify/getQr',

        module: async (query, request) => {
            const data = {
                verifyConfigId: query.vid,
                verifyType: query.type,
                token: query.token,
                params: JSON.stringify({
                    event_id: query.evid,
                    sign: query.sign
                }),
                size: 150
            }

            const res = await request(
                'POST',
                `https://music.163.com/weapi/frontrisk/verify/getqrcode`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            const result = `https://st.music.163.com/encrypt-pages?qrCode=${
                res.body.data.qrCode
            }&verifyToken=${query.token}&verifyId=${query.vid}&verifyType=${
                query.type
            }¶ms=${JSON.stringify({
                event_id: query.evid,
                sign: query.sign
            })}`
            return {
                status: 200,
                body: {
                    code: 200,
                    data: {
                        qrCode: res.body.data.qrCode,
                        qrurl: result,
                        qrimg: await QRCode.toDataURL(result)
                    }
                }
            }
        }
    },

    {
        identifier: 'user_update',

        route: '/user/update',

        module: (query, request) => {
            const data = {
                avatarImgId: '0',
                birthday: query.birthday,
                city: query.city,
                gender: query.gender,
                nickname: query.nickname,
                province: query.province,
                signature: query.signature
            }
            return request('POST', `https://music.163.com/weapi/user/profile/update`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_subcount',

        route: '/user/subcount',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/subcount`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'user_replacephone',

        route: '/user/replacephone',

        module: (query, request) => {
            const data = {
                phone: query.phone,
                captcha: query.captcha,
                oldcaptcha: query.oldcaptcha,
                countrycode: query.countrycode || '86'
            }
            return request('POST', `https://music.163.com/api/user/replaceCellphone`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_record',

        route: '/user/record',

        module: (query, request) => {
            const data = {
                uid: query.uid,
                type: query.type || 0 // 1: 最近一周, 0: 所有时间
            }
            return request('POST', `https://music.163.com/weapi/v1/play/record`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_playlist',

        route: '/user/playlist',

        module: (query, request) => {
            const data = {
                uid: query.uid,
                limit: query.limit || 30,
                offset: query.offset || 0,
                includeVideo: true
            }
            return request('POST', `https://music.163.com/api/user/playlist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_level',

        route: '/user/level',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/weapi/user/level`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_follows',

        route: '/user/follows',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                limit: query.limit || 30,
                order: true
            }
            return request(
                'POST',
                `https://music.163.com/weapi/user/getfollows/${query.uid}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'user_followeds',

        route: '/user/followeds',

        module: (query, request) => {
            const data = {
                userId: query.uid,
                time: '0',
                limit: query.limit || 30,
                offset: query.offset || 0,
                getcounts: 'true'
            }
            return request(
                'POST',
                `https://music.163.com/eapi/user/getfolloweds/${query.uid}`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/user/getfolloweds',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'user_event',

        route: '/user/event',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                getcounts: true,
                time: query.lasttime || -1,
                limit: query.limit || 30,
                total: false
            }
            return request('POST', `https://music.163.com/api/event/get/${query.uid}`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_dj',

        route: '/user/dj',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/dj/program/${query.uid}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_detail',

        route: '/user/detail',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/v1/user/detail/${query.uid}`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'user_comment_history',

        route: '/user/comment/history',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                compose_reminder: 'true',
                compose_hot_comment: 'true',
                limit: query.limit || 10,
                user_id: query.uid,
                time: query.time || 0
            }
            return request('POST', `https://music.163.com/api/comment/user/comment/history`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_cloud_detail',

        route: '/user/cloud/detail',

        module: (query, request) => {
            const id = query.id.replace(/\s/g, '').split(',')
            const data = {
                songIds: id
            }
            return request('POST', `https://music.163.com/weapi/v1/cloud/get/byids`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_cloud_del',

        route: '/user/cloud/del',

        module: (query, request) => {
            const data = {
                songIds: [query.id]
            }
            return request('POST', `https://music.163.com/weapi/cloud/del`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_cloud',

        route: '/user/cloud',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/api/v1/cloud/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_bindingcellphone',

        route: '/user/bindingcellphone',

        module: (query, request) => {
            const data = {
                phone: query.phone,
                countrycode: query.countrycode || '86',
                captcha: query.captcha,
                password: query.password
                    ? crypto.createHash('md5').update(query.password).digest('hex')
                    : ''
            }
            return request('POST', `https://music.163.com/api/user/bindingCellphone`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_binding',

        route: '/user/binding',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/api/v1/user/bindings/${query.uid}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'user_audio',

        route: '/user/audio',

        module: (query, request) => {
            const data = {
                userId: query.uid
            }
            return request('POST', `https://music.163.com/weapi/djradio/get/byuser`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'user_account',

        route: '/user/account',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/nuser/account/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'ugc_user_devote',

        route: '/ugc/user/devote',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/weapi/rep/ugc/user/devote`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/rep/ugc/user/devote'
            })
        }
    },

    {
        identifier: 'ugc_song_get',

        route: '/ugc/song/get',

        module: (query, request) => {
            const data = {
                songId: query.id
            }
            return request('POST', `https://music.163.com/weapi/rep/ugc/song/get`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/rep/ugc/song/get'
            })
        }
    },

    {
        identifier: 'ugc_mv_get',

        route: '/ugc/mv/get',

        module: (query, request) => {
            const data = {
                mvId: query.id
            }
            return request('POST', `https://music.163.com/weapi/rep/ugc/mv/get`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/rep/ugc/mv/get'
            })
        }
    },

    {
        identifier: 'ugc_detail',

        route: '/ugc/detail',

        module: (query, request) => {
            const data = {
                auditStatus: query.auditStatus || '',
                //待审核:0 未采纳:-5 审核中:1 部分审核通过:4 审核通过:5
                //WAIT:0 REJECT:-5 AUDITING:1 PARTLY_APPROVED:4 PASS:5
                limit: query.limit || 10,
                offset: query.offset || 0,
                order: query.order || 'desc', //asc
                sortBy: query.sortBy || 'createTime',
                type: query.type || 1
                //曲库纠错 ARTIST:1 ALBUM:2 SONG:3 MV:4 LYRIC:5 TLYRIC:6
                //曲库补充 ALBUM:101 MV:103
            }
            return request('POST', `https://music.163.com/weapi/rep/ugc/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'ugc_artist_search',

        route: '/ugc/artist/search',

        module: (query, request) => {
            const data = {
                keyword: query.keyword,
                limit: query.limit || 40
            }
            return request('POST', `https://music.163.com/api/rep/ugc/artist/search`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/rep/ugc/artist/search'
            })
        }
    },

    {
        identifier: 'ugc_artist_get',

        route: '/ugc/artist/get',

        module: (query, request) => {
            const data = {
                artistId: query.id
            }
            return request('POST', `https://music.163.com/weapi/rep/ugc/artist/get`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/rep/ugc/artist/get'
            })
        }
    },

    {
        identifier: 'ugc_album_get',

        route: '/ugc/album/get',

        module: (query, request) => {
            const data = {
                albumId: query.id
            }
            return request('POST', `https://music.163.com/weapi/rep/ugc/album/get`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/rep/ugc/album/get'
            })
        }
    },

    {
        identifier: 'top_song',

        route: '/top/song',

        module: (query, request) => {
            const data = {
                areaId: query.type || 0, // 全部:0 华语:7 欧美:96 日本:8 韩国:16
                // limit: query.limit || 100,
                // offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/v1/discovery/new/songs`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'top_playlist_highquality',

        route: '/top/playlist/highquality',

        module: (query, request) => {
            const data = {
                cat: query.cat || '全部', // 全部,华语,欧美,韩语,日语,粤语,小语种,运动,ACG,影视原声,流行,摇滚,后摇,古风,民谣,轻音乐,电子,器乐,说唱,古典,爵士
                limit: query.limit || 50,
                lasttime: query.before || 0, // 歌单updateTime
                total: true
            }
            return request('POST', `https://music.163.com/api/playlist/highquality/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'top_playlist',

        route: '/top/playlist',

        module: (query, request) => {
            const data = {
                cat: query.cat || '全部', // 全部,华语,欧美,日语,韩语,粤语,小语种,流行,摇滚,民谣,电子,舞曲,说唱,轻音乐,爵士,乡村,R&B/Soul,古典,民族,英伦,金属,朋克,蓝调,雷鬼,世界音乐,拉丁,另类/独立,New Age,古风,后摇,Bossa Nova,清晨,夜晚,学习,工作,午休,下午茶,地铁,驾车,运动,旅行,散步,酒吧,怀旧,清新,浪漫,性感,伤感,治愈,放松,孤独,感动,兴奋,快乐,安静,思念,影视原声,ACG,儿童,校园,游戏,70后,80后,90后,网络歌曲,KTV,经典,翻唱,吉他,钢琴,器乐,榜单,00后
                order: query.order || 'hot', // hot,new
                limit: query.limit || 50,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/playlist/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'top_mv',

        route: '/top/mv',

        module: (query, request) => {
            const data = {
                area: query.area || '',
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/mv/toplist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'top_list',

        route: '/top/list',

        module: (query, request) => {
            query.cookie.os = 'pc'
            if (query.idx) {
                return Promise.resolve({
                    status: 500,
                    body: {
                        code: 500,
                        msg: '不支持此方式调用,只支持id调用'
                    }
                })
            }

            const data = {
                id: query.id,
                n: '500',
                s: '0'
            }
            return request(
                'POST',
                `https://interface3.music.163.com/api/playlist/v4/detail`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'top_artists',

        route: '/top/artists',

        module: (query, request) => {
            const data = {
                limit: query.limit || 50,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/artist/top`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'top_album',

        route: '/top/album',

        module: (query, request) => {
            const date = new Date()

            const data = {
                area: query.area || 'ALL', // //ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
                limit: query.limit || 50,
                offset: query.offset || 0,
                type: query.type || 'new',
                year: query.year || date.getFullYear(),
                month: query.month || date.getMonth() + 1,
                total: false,
                rcmd: true
            }
            return request('POST', `https://music.163.com/api/discovery/new/albums/area`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'toplist_detail',

        route: '/toplist/detail',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/toplist/detail`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'toplist_artist',

        route: '/toplist/artist',

        module: (query, request) => {
            const data = {
                type: query.type || 1,
                limit: 100,
                offset: 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/toplist/artist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'toplist',

        route: '/toplist',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/api/toplist`,
                {},
                {
                    crypto: 'api',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'topic_sublist',

        route: '/topic/sublist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 50,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/api/topic/sublist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'topic_detail_event_hot',

        route: '/topic/detail/event/hot',

        module: (query, request) => {
            const data = {
                actid: query.actid
            }
            return request('POST', `https://music.163.com/api/act/event/hot`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'topic_detail',

        route: '/topic/detail',

        module: (query, request) => {
            const data = {
                actid: query.actid
            }
            return request('POST', `https://music.163.com/api/act/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'threshold_detail_get',

        route: '/threshold/detail/get',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/weapi/influencer/web/apply/threshold/detail/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/influencer/web/apply/threshold/detail/get'
                }
            )
        }
    },

    {
        identifier: 'summary_annual',

        route: '/summary/annual',

        module: (query, request) => {
            const data = {}
            const key = ['2017', '2018', '2019'].indexOf(query.year) > -1 ? 'userdata' : 'data'
            return request(
                'POST',
                `https://music.163.com/weapi/activity/summary/annual/${query.year}/${key}`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: `/api/activity/summary/annual/${query.year}/${key}`
                }
            )
        }
    },

    {
        identifier: 'style_song',

        route: '/style/song',

        module: (query, request) => {
            const data = {
                cursor: query.cursor || 0,
                size: query.size || 20,
                tagId: query.tagId,
                sort: query.sort || 0
            }
            return request('POST', `https://music.163.com/api/style-tag/home/song`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'style_preference',

        route: '/style/preference',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/tag/my/preference/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'style_playlist',

        route: '/style/playlist',

        module: (query, request) => {
            const data = {
                cursor: query.cursor || 0,
                size: query.size || 20,
                tagId: query.tagId,
                sort: 0
            }
            return request('POST', `https://music.163.com/api/style-tag/home/playlist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'style_list',

        route: '/style/list',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/tag/list/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'style_detail',

        route: '/style/detail',

        module: (query, request) => {
            const data = {
                tagId: query.tagId
            }
            return request('POST', `https://music.163.com/api/style-tag/home/head`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'style_artist',

        route: '/style/artist',

        module: (query, request) => {
            const data = {
                cursor: query.cursor || 0,
                size: query.size || 20,
                tagId: query.tagId,
                sort: 0
            }
            return request('POST', `https://music.163.com/api/style-tag/home/artist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'style_album',

        route: '/style/album',

        module: (query, request) => {
            const data = {
                cursor: query.cursor || 0,
                size: query.size || 20,
                tagId: query.tagId,
                sort: query.sort || 0
            }
            return request('POST', `https://music.163.com/api/style-tag/home/album`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'starpick_comments_summary',

        route: '/starpick/comments/summary',

        module: (query, request) => {
            const data = {
                cursor: JSON.stringify({
                    offset: 0,
                    blockCodeOrderList: ['HOMEPAGE_BLOCK_NEW_HOT_COMMENT'],
                    refresh: true
                })
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/homepage/block/page`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/homepage/block/page',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'song_wiki_summary',

        route: '/song/wiki/summary',

        module: (query, request) => {
            const data = {
                songId: query.id
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/music/wiki/home/song/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/song/play/about/block/page'
                }
            )
        }
    },

    {
        identifier: 'song_url_v1',

        route: '/song/url/v1',

        module: (query, request) => {
            query.cookie.os = 'android'
            query.cookie.appver = '8.10.05'
            const data = {
                ids: '[' + query.id + ']',
                level: query.level,
                encodeType: 'flac'
            }
            if (data.level == 'sky') {
                data.immerseType = 'c51'
            }
            console.log(data)
            return request(
                'POST',
                `https://interface.music.163.com/eapi/song/enhance/player/url/v1`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/song/enhance/player/url/v1'
                }
            )
        }
    },

    {
        identifier: 'song_url',

        route: '/song/url',

        module: async (query, request) => {
            query.cookie.os = 'pc'
            const ids = query.id.split(',')
            const data = {
                ids: JSON.stringify(ids),
                br: parseInt(query.br || 999000)
            }
            const res = await request(
                'POST',
                `https://interface3.music.163.com/eapi/song/enhance/player/url`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/song/enhance/player/url'
                }
            )
            // 根据id排序
            const result = res.body.data
            result.sort((a, b) => {
                return ids.indexOf(String(a.id)) - ids.indexOf(String(b.id))
            })
            return {
                status: 200,
                body: {
                    code: 200,
                    data: result
                }
            }
        }
    },

    {
        identifier: 'song_purchased',

        route: '/song/purchased',

        module: (query, request) => {
            const data = {
                limit: query.limit || 20,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/single/mybought/song/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'song_order_update',

        route: '/song/order/update',

        module: (query, request) => {
            const data = {
                pid: query.pid,
                trackIds: query.ids,
                op: 'update'
            }

            return request(
                'POST',
                `http://interface.music.163.com/api/playlist/manipulate/tracks`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/playlist/desc/update',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'song_download_url',

        route: '/song/download/url',

        module: (query, request) => {
            const data = {
                id: query.id,
                br: parseInt(query.br || 999000)
            }
            return request(
                'POST',
                `https://interface.music.163.com/eapi/song/enhance/download/url`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/song/enhance/download/url'
                }
            )
        }
    },

    {
        identifier: 'song_detail',

        route: '/song/detail',

        module: (query, request) => {
            query.ids = query.ids.split(/\s*,\s*/)
            const data = {
                c: '[' + query.ids.map((id) => '{"id":' + id + '}').join(',') + ']'
            }
            return request('POST', `https://music.163.com/api/v3/song/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'simi_user',

        route: '/simi/user',

        module: (query, request) => {
            const data = {
                songid: query.id,
                limit: query.limit || 50,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/discovery/simiUser`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'simi_song',

        route: '/simi/song',

        module: (query, request) => {
            const data = {
                songid: query.id,
                limit: query.limit || 50,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/v1/discovery/simiSong`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'simi_playlist',

        route: '/simi/playlist',

        module: (query, request) => {
            const data = {
                songid: query.id,
                limit: query.limit || 50,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/discovery/simiPlaylist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'simi_mv',

        route: '/simi/mv',

        module: (query, request) => {
            const data = {
                mvid: query.mvid
            }
            return request('POST', `https://music.163.com/weapi/discovery/simiMV`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'simi_artist',

        route: '/simi/artist',

        module: (query, request) => {
            const data = {
                artistid: query.id
            }
            return request('POST', `https://music.163.com/weapi/discovery/simiArtist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'sign_happy_info',

        route: '/sign/happy/info',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/sign/happy/info`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'signin_progress',

        route: '/signin/progress',

        module: (query, request) => {
            const data = {
                moduleId: query.moduleId || '1207signin-1207signin'
            }
            return request(
                'POST',
                `https://music.163.com/weapi/act/modules/signin/v2/progress`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'sheet_preview',

        route: '/sheet/preview',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi//music/sheet/preview/info?id=${query.id}`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api//music/sheet/preview/info' // 我没写错! 他们就是这么请求的!
                }
            )
        }
    },

    {
        identifier: 'sheet_list',

        route: '/sheet/list',

        module: (query, request) => {
            const data = {
                id: query.id,
                abTest: query.ab || 'b'
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/music/sheet/list/v1`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/music/sheet/list/v1'
                }
            )
        }
    },

    {
        identifier: 'share_resource',

        route: '/share/resource',

        module: (query, request) => {
            const data = {
                type: query.type || 'song', // song,playlist,mv,djprogram,djradio,noresource
                msg: query.msg || '',
                id: query.id || ''
            }
            return request('POST', `https://music.163.com/weapi/share/friends/resource`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'setting',

        route: '/setting',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/user/setting`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'send_text',

        route: '/send/text',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                type: 'text',
                msg: query.msg,
                userIds: '[' + query.user_ids + ']'
            }
            return request('POST', `https://music.163.com/weapi/msg/private/send`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'send_song',

        route: '/send/song',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                id: query.id,
                msg: query.msg || '',
                type: 'song',
                userIds: '[' + query.user_ids + ']'
            }
            return request('POST', `https://music.163.com/api/msg/private/send`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'send_playlist',

        route: '/send/playlist',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                id: query.playlist,
                type: 'playlist',
                msg: query.msg,
                userIds: '[' + query.user_ids + ']'
            }
            return request('POST', `https://music.163.com/weapi/msg/private/send`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'send_album',

        route: '/send/album',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                id: query.id,
                msg: query.msg || '',
                type: 'album',
                userIds: '[' + query.user_ids + ']'
            }
            return request('POST', `https://music.163.com/api/msg/private/send`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'search_suggest',

        route: '/search/suggest',

        module: (query, request) => {
            const data = {
                s: query.keywords || ''
            }
            const type = query.type == 'mobile' ? 'keyword' : 'web'
            return request('POST', `https://music.163.com/weapi/search/suggest/` + type, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'search_multimatch',

        route: '/search/multimatch',

        module: (query, request) => {
            const data = {
                type: query.type || 1,
                s: query.keywords || ''
            }
            return request('POST', `https://music.163.com/weapi/search/suggest/multimatch`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'search_hot_detail',

        route: '/search/hot/detail',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/weapi/hotsearchlist/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'search_hot',

        route: '/search/hot',

        module: (query, request) => {
            const data = {
                type: 1111
            }
            return request('POST', `https://music.163.com/weapi/search/hot`, data, {
                crypto: 'weapi',
                ua: 'mobile',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'search_default',

        route: '/search/default',

        module: (query, request) => {
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/search/defaultkeyword/get`,
                {},
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/search/defaultkeyword/get',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'search',

        route: '/search',

        module: (query, request) => {
            if (query.type && query.type == '2000') {
                const data = {
                    keyword: query.keywords,
                    scene: 'normal',
                    limit: query.limit || 30,
                    offset: query.offset || 0
                }
                return request('POST', `https://music.163.com/api/search/voice/get`, data, {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                })
            }
            const data = {
                s: query.keywords,
                type: query.type || 1, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
                limit: query.limit || 30,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/search/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'scrobble',

        route: '/scrobble',

        module: (query, request) => {
            const data = {
                logs: JSON.stringify([
                    {
                        action: 'play',
                        json: {
                            download: 0,
                            end: 'playend',
                            id: query.id,
                            sourceId: query.sourceid,
                            time: query.time,
                            type: 'song',
                            wifi: 0,
                            source: 'list'
                        }
                    }
                ])
            }

            return request('POST', `https://music.163.com/weapi/feedback/weblog`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'resource_like',

        route: '/resource/like',

        module: (query, request) => {
            query.cookie.os = 'android'
            query.t = query.t == 1 ? 'like' : 'unlike'
            query.type = resourceTypeMap[query.type]
            const data = {
                threadId: query.type + query.id
            }
            if (query.type === 'A_EV_2_') {
                data.threadId = query.threadId
            }
            return request('POST', `https://music.163.com/weapi/resource/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'related_playlist',

        route: '/related/playlist',

        module: (query, request) => {
            return request(
                'GET',
                `https://music.163.com/playlist?id=${query.id}`,
                {},
                {
                    ua: 'pc',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            ).then((response) => {
                try {
                    const pattern = /[\s\S]*?[\s\S]*?]*>([^<]+?)<\/a>[\s\S]*?]*>([^<]+?)<\/a>/g
                    let result = []
                    const playlists = []
                    while ((result = pattern.exec(response.body)) != null) {
                        playlists.push({
                            creator: {
                                userId: result[4].slice('/user/home?id='.length),
                                nickname: result[5]
                            },
                            coverImgUrl: result[1].slice(0, -'?param=50y50'.length),
                            name: result[3],
                            id: result[2].slice('/playlist?id='.length)
                        })
                    }
                    response.body = { code: 200, playlists: playlists }
                    return response
                } catch (err) {
                    response.status = 500
                    response.body = { code: 500, msg: err.stack }
                    return Promise.reject(response)
                }
            })
        }
    },

    {
        identifier: 'related_allvideo',

        route: '/related/allvideo',

        module: (query, request) => {
            const data = {
                id: query.id,
                type: /^\d+$/.test(query.id) ? 0 : 1
            }
            return request(
                'POST',
                `https://music.163.com/weapi/cloudvideo/v1/allvideo/rcmd`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'register_cellphone',

        route: '/register/cellphone',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                captcha: query.captcha,
                phone: query.phone,
                password: crypto.createHash('md5').update(query.password).digest('hex'),
                nickname: query.nickname,
                countrycode: query.countrycode || '86'
            }
            return request('POST', `https://music.163.com/api/register/cellphone`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'register_anonimous',

        route: '/register/anonimous',

        module: async (query, request) => {
            query.cookie.os = 'iOS'
            const deviceId = `NMUSIC`
            const encodedId = Buffer.from(`${deviceId} ${cloudmusic_dll_encode_id(deviceId)}`)
            const username = encodedId.toString('base64')
            const data = {
                /* A base64 encoded string. */
                username: username
            }
            let result = await request(
                'POST',
                `https://music.163.com/api/register/anonimous`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            if (result.body.code === 200) {
                result = {
                    status: 200,
                    body: {
                        ...result.body,
                        cookie: result.cookie.join(';')
                    },
                    cookie: result.cookie
                }
            }
            return result
        }
    },

    {
        identifier: 'record_recent_voice',

        route: '/record/recent/voice',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/play-record/voice/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'record_recent_video',

        route: '/record/recent/video',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/play-record/newvideo/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'record_recent_song',

        route: '/record/recent/song',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/play-record/song/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'record_recent_playlist',

        route: '/record/recent/playlist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/play-record/playlist/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'record_recent_dj',

        route: '/record/recent/dj',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/play-record/djradio/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'record_recent_album',

        route: '/record/recent/album',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/play-record/album/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'recommend_songs',

        route: '/recommend/songs',

        module: (query, request) => {
            query.cookie.os = 'ios'
            const data = {}
            return request('POST', `https://music.163.com/api/v3/discovery/recommend/songs`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'recommend_resource',

        route: '/recommend/resource',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/v1/discovery/recommend/resource`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'rebind',

        route: '/rebind',

        module: (query, request) => {
            const data = {
                captcha: query.captcha,
                phone: query.phone,
                oldcaptcha: query.oldcaptcha,
                ctcode: query.ctcode || '86'
            }
            return request('POST', `https://music.163.com/api/user/replaceCellphone`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'program_recommend',

        route: '/program/recommend',

        module: (query, request) => {
            const data = {
                cateId: query.type,
                limit: query.limit || 10,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/program/recommend/v1`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'pl_count',

        route: '/pl/count',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/weapi/pl/count`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playmode_song_vector',

        route: '/playmode/song/vector',

        module: (query, request) => {
            const data = {
                ids: query.ids
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/playmode/song/vector/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/playmode/song/vector/get'
                }
            )
        }
    },

    {
        identifier: 'playmode_intelligence_list',

        route: '/playmode/intelligence/list',

        module: (query, request) => {
            const data = {
                songId: query.id,
                type: 'fromPlayOne',
                playlistId: query.pid,
                startMusicId: query.sid || query.id,
                count: query.count || 1
            }
            return request('POST', `https://music.163.com/weapi/playmode/intelligence/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_video_recent',

        route: '/playlist/video/recent',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/playlist/video/recent`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_update_playcount',

        route: '/playlist/update/playcount',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/api/playlist/update/playcount`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_update',

        route: '/playlist/update',

        module: (query, request) => {
            query.cookie.os = 'pc'
            query.desc = query.desc || ''
            query.tags = query.tags || ''
            const data = {
                '/api/playlist/desc/update': `{"id":${query.id},"desc":"${query.desc}"}`,
                '/api/playlist/tags/update': `{"id":${query.id},"tags":"${query.tags}"}`,
                '/api/playlist/update/name': `{"id":${query.id},"name":"${query.name}"}`
            }
            return request('POST', `https://music.163.com/weapi/batch`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_track_delete',

        route: '/playlist/track/delete',

        module: async (query, request) => {
            query.cookie.os = 'pc'
            query.ids = query.ids || ''
            const data = {
                id: query.id,
                tracks: JSON.stringify(
                    query.ids.split(',').map((item) => {
                        return { type: 3, id: item }
                    })
                )
            }

            return request('POST', `https://music.163.com/api/playlist/track/delete`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_track_all',

        route: '/playlist/track/all',

        module: (query, request) => {
            const data = {
                id: query.id,
                n: 100000,
                s: query.s || 8
            }
            //不放在data里面避免请求带上无用的数据
            const limit = parseInt(query.limit) || Infinity
            const offset = parseInt(query.offset) || 0

            return request('POST', `https://music.163.com/api/v6/playlist/detail`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            }).then((res) => {
                const trackIds = res.body.playlist.trackIds
                const idsData = {
                    c:
                        '[' +
                        trackIds
                            .slice(offset, offset + limit)
                            .map((item) => '{"id":' + item.id + '}')
                            .join(',') +
                        ']'
                }

                return request('POST', `https://music.163.com/api/v3/song/detail`, idsData, {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                })
            })
        }
    },

    {
        identifier: 'playlist_track_add',

        route: '/playlist/track/add',

        module: async (query, request) => {
            query.cookie.os = 'pc'
            query.ids = query.ids || ''
            const data = {
                id: query.pid,
                tracks: JSON.stringify(
                    query.ids.split(',').map((item) => {
                        return { type: 3, id: item }
                    })
                )
            }
            console.log(data)

            return request('POST', `https://music.163.com/api/playlist/track/add`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_tracks',

        route: '/playlist/tracks',

        module: async (query, request) => {
            // query.cookie.os = 'pc'
            const tracks = query.tracks.split(',')
            const data = {
                op: query.op, // del,add
                pid: query.pid, // 歌单id
                trackIds: JSON.stringify(tracks), // 歌曲id
                imme: 'true'
            }

            try {
                const res = await request(
                    'POST',
                    `https://music.163.com/weapi/playlist/manipulate/tracks`,
                    data,
                    {
                        crypto: 'weapi',
                        cookie: query.cookie,
                        proxy: query.proxy,
                        realIP: query.realIP
                    }
                )
                return {
                    status: 200,
                    body: {
                        ...res
                    }
                }
            } catch (error) {
                if (error.body.code === 512) {
                    return request(
                        'POST',
                        `https://music.163.com/api/playlist/manipulate/tracks`,
                        {
                            op: query.op, // del,add
                            pid: query.pid, // 歌单id
                            trackIds: JSON.stringify([...tracks, ...tracks]),
                            imme: 'true'
                        },
                        {
                            crypto: 'weapi',
                            cookie: query.cookie,
                            proxy: query.proxy,
                            realIP: query.realIP
                        }
                    )
                } else {
                    return {
                        status: 200,
                        body: error.body
                    }
                }
            }
        }
    },

    {
        identifier: 'playlist_tags_update',

        route: '/playlist/tags/update',

        module: (query, request) => {
            const data = {
                id: query.id,
                tags: query.tags
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/playlist/tags/update`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/playlist/tags/update',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'playlist_subscribers',

        route: '/playlist/subscribers',

        module: (query, request) => {
            const data = {
                id: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/playlist/subscribers`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_subscribe',

        route: '/playlist/subscribe',

        module: (query, request) => {
            query.t = query.t == 1 ? 'subscribe' : 'unsubscribe'
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/weapi/playlist/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_privacy',

        route: '/playlist/privacy',

        module: (query, request) => {
            const data = {
                id: query.id,
                privacy: 0
            }
            return request(
                'POST',
                `https://interface.music.163.com/eapi/playlist/update/privacy`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/playlist/update/privacy'
                }
            )
        }
    },

    {
        identifier: 'playlist_order_update',

        route: '/playlist/order/update',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                ids: query.ids
            }
            return request('POST', `https://music.163.com/api/playlist/order/update`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_name_update',

        route: '/playlist/name/update',

        module: (query, request) => {
            const data = {
                id: query.id,
                name: query.name
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/playlist/update/name`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/playlist/update/name',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'playlist_mylike',

        route: '/playlist/mylike',

        module: (query, request) => {
            const data = {
                time: query.time || '-1',
                limit: query.limit || '12'
            }
            return request(
                'POST',
                `https://music.163.com/api/mlog/playlist/mylike/bytime/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'playlist_hot',

        route: '/playlist/hot',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/playlist/hottags`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'playlist_highquality_tags',

        route: '/playlist/highquality/tags',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/playlist/highquality/tags`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_detail_dynamic',

        route: '/playlist/detail/dynamic',

        module: (query, request) => {
            const data = {
                id: query.id,
                n: 100000,
                s: query.s || 8
            }
            return request('POST', `https://music.163.com/api/playlist/detail/dynamic`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_detail',

        route: '/playlist/detail',

        module: (query, request) => {
            const data = {
                id: query.id,
                n: 100000,
                s: query.s || 8
            }
            return request('POST', `https://music.163.com/api/v6/playlist/detail`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_desc_update',

        route: '/playlist/desc/update',

        module: (query, request) => {
            const data = {
                id: query.id,
                desc: query.desc
            }
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/playlist/desc/update`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/playlist/desc/update',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'playlist_delete',

        route: '/playlist/delete',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                ids: '[' + query.id + ']'
            }
            return request('POST', `https://music.163.com/weapi/playlist/remove`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_create',

        route: '/playlist/create',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                name: query.name,
                privacy: query.privacy, //0 为普通歌单，10 为隐私歌单
                type: query.type || 'NORMAL' // NORMAL|VIDEO|SHARED
            }
            return request('POST', `https://music.163.com/api/playlist/create`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'playlist_cover_update',

        route: '/playlist/cover/update',

        module: async (query, request) => {
            if (!query.imgFile) {
                return {
                    status: 400,
                    body: {
                        code: 400,
                        msg: 'imgFile is required'
                    }
                }
            }
            const uploadInfo = await uploadPlugin(query, request)
            const res = await request(
                'POST',
                `https://music.163.com/weapi/playlist/cover/update`,
                {
                    id: query.id,
                    coverImgId: uploadInfo.imgId
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            return {
                status: 200,
                body: {
                    code: 200,
                    data: {
                        ...uploadInfo,
                        ...res.body
                    }
                }
            }
        }
    },

    {
        identifier: 'playlist_catlist',

        route: '/playlist/catlist',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/playlist/catalogue`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'personal_fm',

        route: '/personal_fm',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/v1/radio/get`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'personalized_privatecontent_list',

        route: '/personalized/privatecontent/list',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                total: 'true',
                limit: query.limit || 60
            }
            return request('POST', `https://music.163.com/api/v2/privatecontent/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'personalized_privatecontent',

        route: '/personalized/privatecontent',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/personalized/privatecontent`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'personalized_newsong',

        route: '/personalized/newsong',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                type: 'recommend',
                limit: query.limit || 10,
                areaId: query.areaId || 0
            }
            return request('POST', `https://music.163.com/api/personalized/newsong`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'personalized_mv',

        route: '/personalized/mv',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/personalized/mv`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'personalized_djprogram',

        route: '/personalized/djprogram',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/personalized/djprogram`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'personalized',

        route: '/personalized',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                // offset: query.offset || 0,
                total: true,
                n: 1000
            }
            return request('POST', `https://music.163.com/weapi/personalized/playlist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'nickname_check',

        route: '/nickname/check',

        module: (query, request) => {
            const data = {
                nickname: query.nickname
            }
            return request('POST', `https://music.163.com/api/nickname/duplicated`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_url',

        route: '/mv/url',

        module: (query, request) => {
            const data = {
                id: query.id,
                r: query.r || 1080
            }
            return request('POST', `https://music.163.com/weapi/song/enhance/play/mv/url`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_sublist',

        route: '/mv/sublist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 25,
                offset: query.offset || 0,
                total: true
            }
            return request(
                'POST',
                `https://music.163.com/weapi/cloudvideo/allvideo/sublist`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'mv_sub',

        route: '/mv/sub',

        module: (query, request) => {
            query.t = query.t == 1 ? 'sub' : 'unsub'
            const data = {
                mvId: query.mvid,
                mvIds: '["' + query.mvid + '"]'
            }
            return request('POST', `https://music.163.com/weapi/mv/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_first',

        route: '/mv/first',

        module: (query, request) => {
            const data = {
                // 'offset': query.offset || 0,
                area: query.area || '',
                limit: query.limit || 30,
                total: true
            }
            return request('POST', `https://interface.music.163.com/weapi/mv/first`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_exclusive_rcmd',

        route: '/mv/exclusive/rcmd',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                limit: query.limit || 30
            }
            return request('POST', `https://interface.music.163.com/api/mv/exclusive/rcmd`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_detail_info',

        route: '/mv/detail/info',

        module: (query, request) => {
            const data = {
                threadid: `R_MV_5_${query.mvid}`,
                composeliked: true
            }
            return request('POST', `https://music.163.com/api/comment/commentthread/info`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_detail',

        route: '/mv/detail',

        module: (query, request) => {
            const data = {
                id: query.mvid
            }
            return request('POST', `https://music.163.com/api/v1/mv/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mv_all',

        route: '/mv/all',

        module: (query, request) => {
            const data = {
                tags: JSON.stringify({
                    地区: query.area || '全部',
                    类型: query.type || '全部',
                    排序: query.order || '上升最快'
                }),
                offset: query.offset || 0,
                total: 'true',
                limit: query.limit || 30
            }
            return request('POST', `https://interface.music.163.com/api/mv/all`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'music_first_listen_info',

        route: '/music/first/listen/info',

        module: (query, request) => {
            const data = {
                songId: query.id
            }
            return request(
                'POST',
                `https://interface3.music.163.com/api/content/activity/music/first/listen/info`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'musician_tasks_new',

        route: '/musician/tasks/new',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/api/nmusician/workbench/mission/stage/list `,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'musician_tasks',

        route: '/musician/tasks',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/weapi/nmusician/workbench/mission/cycle/list`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'musician_sign',

        route: '/musician/sign',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/weapi/creator/user/access`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'musician_play_trend',

        route: '/musician/play/trend',

        module: (query, request) => {
            const data = {
                startTime: query.startTime,
                endTime: query.endTime
            }
            return request(
                'POST',
                `https://music.163.com/weapi/creator/musician/play/count/statistic/data/trend/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'musician_data_overview',

        route: '/musician/data/overview',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://music.163.com/weapi/creator/musician/statistic/data/overview/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'musician_cloudbean_obtain',

        route: '/musician/cloudbean/obtain',

        module: (query, request) => {
            const data = {
                userMissionId: query.id,
                period: query.period
            }
            return request(
                'POST',
                `https://music.163.com/weapi/nmusician/workbench/mission/reward/obtain/new`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'musician_cloudbean',

        route: '/musician/cloudbean',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/weapi/cloudbean/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'msg_recentcontact',

        route: '/msg/recentcontact',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://music.163.com/api/msg/recentcontact/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'msg_private_history',

        route: '/msg/private/history',

        module: (query, request) => {
            const data = {
                userId: query.uid,
                limit: query.limit || 30,
                time: query.before || 0,
                total: 'true'
            }
            return request('POST', `https://music.163.com/api/msg/private/history`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'msg_private',

        route: '/msg/private',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                limit: query.limit || 30,
                total: 'true'
            }
            return request('POST', `https://music.163.com/api/msg/private/users`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'msg_notices',

        route: '/msg/notices',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                time: query.lasttime || -1
            }
            return request('POST', `https://music.163.com/api/msg/notices`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'msg_forwards',

        route: '/msg/forwards',

        module: (query, request) => {
            const data = {
                offset: query.offset || 0,
                limit: query.limit || 30,
                total: 'true'
            }
            return request('POST', `https://music.163.com/api/forwards/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'msg_comments',

        route: '/msg/comments',

        module: (query, request) => {
            const data = {
                beforeTime: query.before || '-1',
                limit: query.limit || 30,
                total: 'true',
                uid: query.uid
            }

            return request(
                'POST',
                `https://music.163.com/api/v1/user/comments/${query.uid}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'mlog_url',

        route: '/mlog/url',

        module: (query, request) => {
            const data = {
                id: query.id,
                resolution: query.res || 1080,
                type: 1
            }
            return request('POST', `https://music.163.com/weapi/mlog/detail/v1`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mlog_to_video',

        route: '/mlog/to/video',

        module: (query, request) => {
            const data = {
                mlogId: query.id
            }
            return request('POST', `https://music.163.com/weapi/mlog/video/convert/id`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'mlog_music_rcmd',

        route: '/mlog/music/rcmd',

        module: (query, request) => {
            const data = {
                id: query.mvid || 0,
                type: 2,
                rcmdType: 20,
                limit: query.limit || 10,
                extInfo: JSON.stringify({ songId: query.songid })
            }
            return request(
                'POST',
                `https://interface.music.163.com/eapi/mlog/rcmd/feed/list`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    url: '/api/mlog/rcmd/feed/list',
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'lyric_new',

        route: '/lyric/new',

        module: (query, request) => {
            const data = {
                id: query.id,
                cp: false,
                tv: 0,
                lv: 0,
                rv: 0,
                kv: 0,
                yv: 0,
                ytv: 0,
                yrv: 0
            }
            return request('POST', `https://interface3.music.163.com/eapi/song/lyric/v1`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/song/lyric/v1'
            })
        }
    },

    {
        identifier: 'lyric',

        route: '/lyric',

        module: (query, request) => {
            query.cookie.os = 'ios'

            const data = {
                id: query.id,
                tv: -1,
                lv: -1,
                rv: -1,
                kv: -1
            }
            return request('POST', `https://music.163.com/api/song/lyric?_nmclfl=1`, data, {
                crypto: 'api',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'logout',

        route: '/logout',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/logout`,
                {},
                {
                    crypto: 'weapi',
                    ua: 'pc',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'login_status',

        route: '/login/status',

        module: async (query, request) => {
            const data = {}
            let result = await request(
                'POST',
                `https://music.163.com/weapi/w/nuser/account/get`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            if (result.body.code === 200) {
                result = {
                    status: 200,
                    body: {
                        data: {
                            ...result.body
                        }
                    },
                    cookie: result.cookie
                }
            }
            return result
        }
    },

    {
        identifier: 'login_refresh',

        route: '/login/refresh',

        module: async (query, request) => {
            let result = await request(
                'POST',
                `https://music.163.com/weapi/login/token/refresh`,
                {},
                {
                    crypto: 'weapi',
                    ua: 'pc',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            if (result.body.code === 200) {
                result = {
                    status: 200,
                    body: {
                        ...result.body,
                        cookie: result.cookie.join(';')
                    },
                    cookie: result.cookie
                }
            }
            return result
        }
    },

    {
        identifier: 'login_qr_key',

        route: '/login/qr/key',

        module: async (query, request) => {
            const data = {
                type: 1
            }
            const result = await request(
                'POST',
                `https://music.163.com/weapi/login/qrcode/unikey`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            return {
                status: 200,
                body: {
                    data: result.body,
                    code: 200
                },
                cookie: result.cookie
            }
        }
    },

    {
        identifier: 'login_qr_create',

        route: '/login/qr/create',

        module: (query) => {
            return new Promise((resolve) => {
                const url = `https://music.163.com/login?codekey=${query.key}`
                return resolve({
                    code: 200,
                    status: 200,
                    body: {
                        code: 200,
                        data: {
                            qrurl: url,
                            qrimg: query.qrimg ? QRCode.toDataURL(url) : ''
                        }
                    }
                })
            })
        }
    },

    {
        identifier: 'login_qr_check',

        route: '/login/qr/check',

        module: async (query, request) => {
            const data = {
                key: query.key,
                type: 1
            }
            try {
                let result = await request(
                    'POST',
                    `https://music.163.com/weapi/login/qrcode/client/login`,
                    data,
                    {
                        crypto: 'weapi',
                        cookie: query.cookie,
                        proxy: query.proxy,
                        realIP: query.realIP
                    }
                )
                result = {
                    status: 200,
                    body: {
                        ...result.body,
                        cookie: result.cookie.join(';')
                    },
                    cookie: result.cookie
                }
                return result
            } catch (error) {
                return {
                    status: 200,
                    body: {},
                    cookie: query.cookie
                }
            }
        }
    },

    {
        identifier: 'login_cellphone',

        route: '/login/cellphone',

        module: async (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                phone: query.phone,
                countrycode: query.countrycode || '86',
                captcha: query.captcha,
                [query.captcha ? 'captcha' : 'password']: query.captcha
                    ? query.captcha
                    : query.md5_password ||
                      crypto.createHash('md5').update(query.password).digest('hex'),
                rememberLogin: 'true'
            }
            let result = await request(
                'POST',
                `https://music.163.com/weapi/login/cellphone`,
                data,
                {
                    crypto: 'weapi',
                    ua: 'pc',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )

            if (result.body.code === 200) {
                result = {
                    status: 200,
                    body: {
                        ...result.body,
                        cookie: result.cookie.join(';')
                    },
                    cookie: result.cookie
                }
            }
            return result
        }
    },

    {
        identifier: 'login',

        route: '/login',

        module: async (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                username: query.email,
                password:
                    query.md5_password ||
                    crypto.createHash('md5').update(query.password).digest('hex'),
                rememberLogin: 'true'
            }
            let result = await request('POST', `https://music.163.com/api/login`, data, {
                crypto: 'weapi',
                ua: 'pc',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
            if (result.body.code === 502) {
                return {
                    status: 200,
                    body: {
                        msg: '账号或密码错误',
                        code: 502,
                        message: '账号或密码错误'
                    }
                }
            }
            if (result.body.code === 200) {
                result = {
                    status: 200,
                    body: {
                        ...result.body,
                        cookie: result.cookie.join(';')
                    },
                    cookie: result.cookie
                }
            }
            return result
        }
    },

    {
        identifier: 'listentogether_sync_playlist_get',

        route: '/listentogether/sync/playlist/get',

        module: (query, request) => {
            const data = {
                roomId: query.roomId
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/sync/playlist/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/sync/playlist/get'
                }
            )
        }
    },

    {
        identifier: 'listentogether_sync_list_command',

        route: '/listentogether/sync/list/command',

        module: (query, request) => {
            const data = {
                roomId: query.roomId,
                playlistParam: JSON.stringify({
                    commandType: query.commandType,
                    version: [
                        {
                            userId: query.userId,
                            version: query.version
                        }
                    ],
                    anchorSongId: '',
                    anchorPosition: -1,
                    randomList: query.randomList.split(','),
                    displayList: query.displayList.split(',')
                })
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/sync/list/command/report`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/sync/list/command/report'
                }
            )
        }
    },

    {
        identifier: 'listentogether_status',

        route: '/listentogether/status',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/api/listen/together/status/get`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'listentogether_room_create',

        route: '/listentogether/room/create',

        module: (query, request) => {
            const data = {
                refer: 'songplay_more'
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/room/create`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/room/create'
                }
            )
        }
    },

    {
        identifier: 'listentogether_room_check',

        route: '/listentogether/room/check',

        module: (query, request) => {
            const data = {
                roomId: query.roomId
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/room/check`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/room/check'
                }
            )
        }
    },

    {
        identifier: 'listentogether_play_command',

        route: '/listentogether/play/command',

        module: (query, request) => {
            const data = {
                roomId: query.roomId,
                commandInfo: JSON.stringify({
                    commandType: query.commandType,
                    progress: query.progress || 0,
                    playStatus: query.playStatus,
                    formerSongId: query.formerSongId,
                    targetSongId: query.targetSongId,
                    clientSeq: query.clientSeq
                })
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/play/command/report`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/play/command/report'
                }
            )
        }
    },

    {
        identifier: 'listentogether_heatbeat',

        route: '/listentogether/heatbeat',

        module: (query, request) => {
            const data = {
                roomId: query.roomId,
                songId: query.songId,
                playStatus: query.playStatus,
                progress: query.progress
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/heartbeat`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/heartbeat'
                }
            )
        }
    },

    {
        identifier: 'listentogether_end',

        route: '/listentogether/end',

        module: (query, request) => {
            const data = {
                roomId: query.roomId
            }
            return request(
                'POST',
                `http://interface.music.163.com/eapi/listen/together/end/v2`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/listen/together/end/v2'
                }
            )
        }
    },

    {
        identifier: 'likelist',

        route: '/likelist',

        module: (query, request) => {
            const data = {
                uid: query.uid
            }
            return request('POST', `https://music.163.com/weapi/song/like/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'like',

        route: '/like',

        module: (query, request) => {
            query.cookie.os = 'pc'
            query.cookie.appver = '2.9.7'
            query.like = query.like == 'false' ? false : true
            const data = {
                alg: 'itembased',
                trackId: query.id,
                like: query.like,
                time: '3'
            }
            return request('POST', `https://music.163.com/api/radio/like`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'inner_version',

        route: '/inner/version',

        module: () => {
            return new Promise((resolve) => {
                return resolve({
                    code: 200,
                    status: 200,
                    body: {
                        code: 200,
                        data: {
                            version: pkg.version
                        }
                    }
                })
            })
        }
    },

    {
        identifier: 'hug_comment',

        route: '/hug/comment',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            query.type = resourceTypeMap[query.type || 0]
            const threadId = query.type + query.sid
            const data = {
                targetUserId: query.uid,
                commentId: query.cid,
                threadId: threadId
            }
            return request(
                'POST',
                `https://music.163.com/api/v2/resource/comments/hug/listener`,
                data,
                {
                    crypto: 'api',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'hot_topic',

        route: '/hot/topic',

        module: (query, request) => {
            const data = {
                limit: query.limit || 20,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/api/act/hot`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'homepage_dragon_ball',

        route: '/homepage/dragon/ball',

        module: (query, request) => {
            const data = {}
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            return request('POST', `https://music.163.com/eapi/homepage/dragon/ball/static`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                url: '/api/homepage/dragon/ball/static',
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'homepage_block_page',

        route: '/homepage/block/page',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = { refresh: query.refresh || false, cursor: query.cursor }
            return request('POST', `https://music.163.com/api/homepage/block/page`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'history_recommend_songs_detail',

        route: '/history/recommend/songs/detail',

        module: (query, request) => {
            query.cookie.os = 'ios'
            const data = {
                date: query.date || ''
            }
            return request(
                'POST',
                `https://music.163.com/api/discovery/recommend/songs/history/detail`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'history_recommend_songs',

        route: '/history/recommend/songs',

        module: (query, request) => {
            query.cookie.os = 'ios'
            const data = {}
            return request(
                'POST',
                `https://music.163.com/api/discovery/recommend/songs/history/recent`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'get_userids',

        route: '/get/userids',

        module: (query, request) => {
            const data = {
                nicknames: query.nicknames
            }
            return request('POST', `https://music.163.com/api/user/getUserIds`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'follow',

        route: '/follow',

        module: (query, request) => {
            query.cookie.os = 'pc'
            query.t = query.t == 1 ? 'follow' : 'delfollow'
            return request(
                'POST',
                `https://music.163.com/weapi/user/${query.t}/${query.id}`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'fm_trash',

        route: '/fm_trash',

        module: (query, request) => {
            const data = {
                songId: query.id
            }
            return request(
                'POST',
                `https://music.163.com/weapi/radio/trash/add?alg=RT&songId=${
                    query.id
                }&time=${query.time || 25}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'fanscenter_trend_list',

        route: '/fanscenter/trend/list',

        module: (query, request) => {
            const data = {
                startTime: query.startTime || Date.now() - 7 * 24 * 3600 * 1000,
                endTime: query.endTime || Date.now(),
                type: query.type || 0 //新增关注:0 新增取关:1
            }
            return request(
                'POST',
                `https://interface.music.163.com/weapi/fanscenter/trend/list`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/fanscenter/trend/list'
                }
            )
        }
    },

    {
        identifier: 'fanscenter_overview_get',

        route: '/fanscenter/overview/get',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://interface.music.163.com/weapi/fanscenter/overview/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/fanscenter/overview/get'
                }
            )
        }
    },

    {
        identifier: 'fanscenter_basicinfo_province_get',

        route: '/fanscenter/basicinfo/province/get',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://interface.music.163.com/weapi/fanscenter/basicinfo/province/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/fanscenter/basicinfo/province/get'
                }
            )
        }
    },

    {
        identifier: 'fanscenter_basicinfo_gender_get',

        route: '/fanscenter/basicinfo/gender/get',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://interface.music.163.com/weapi/fanscenter/basicinfo/gender/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/fanscenter/basicinfo/gender/get'
                }
            )
        }
    },

    {
        identifier: 'fanscenter_basicinfo_age_get',

        route: '/fanscenter/basicinfo/age/get',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://interface.music.163.com/weapi/fanscenter/basicinfo/age/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/fanscenter/basicinfo/age/get'
                }
            )
        }
    },

    {
        identifier: 'event_forward',

        route: '/event/forward',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                forwards: query.forwards,
                id: query.evId,
                eventUserId: query.uid
            }
            return request('POST', `https://music.163.com/weapi/event/forward`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'event_del',

        route: '/event/del',

        module: (query, request) => {
            const data = {
                id: query.evId
            }
            return request('POST', `https://music.163.com/eapi/event/delete`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'event',

        route: '/event',

        module: (query, request) => {
            const data = {
                pagesize: query.pagesize || 20,
                lasttime: query.lasttime || -1
            }
            return request('POST', `https://music.163.com/weapi/v1/event/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_toplist_popular',

        route: '/dj/toplist/popular',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
                // 不支持 offset
            }
            return request('POST', `https://music.163.com/api/dj/toplist/popular`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_toplist_pay',

        route: '/dj/toplist/pay',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
                // 不支持 offset
            }
            return request('POST', `https://music.163.com/api/djradio/toplist/pay`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_toplist_newcomer',

        route: '/dj/toplist/newcomer',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/api/dj/toplist/newcomer`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_toplist_hours',

        route: '/dj/toplist/hours',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
                // 不支持 offset
            }
            return request('POST', `https://music.163.com/api/dj/toplist/hours`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_toplist',

        route: '/dj/toplist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100,
                offset: query.offset || 0,
                type: typeMap[query.type || 'new'] || '0' //0为新晋,1为热门
            }
            return request('POST', `https://music.163.com/api/djradio/toplist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_today_perfered',

        route: '/dj/today/perfered',

        module: (query, request) => {
            const data = {
                page: query.page || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/home/today/perfered`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_subscriber',

        route: '/dj/subscriber',

        module: (query, request) => {
            const data = {
                time: query.time || '-1',
                id: query.id,
                limit: query.limit || '20',
                total: 'true'
            }
            return request('POST', `https://music.163.com/api/djradio/subscriber`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_sublist',

        route: '/dj/sublist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/djradio/get/subed`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_sub',

        route: '/dj/sub',

        module: (query, request) => {
            query.t = query.t == 1 ? 'sub' : 'unsub'
            const data = {
                id: query.rid
            }
            return request('POST', `https://music.163.com/weapi/djradio/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_recommend_type',

        route: '/dj/recommend/type',

        module: (query, request) => {
            const data = {
                cateId: query.type
            }
            return request('POST', `https://music.163.com/weapi/djradio/recommend`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_recommend',

        route: '/dj/recommend',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/recommend/v1`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_radio_hot',

        route: '/dj/radio/hot',

        module: (query, request) => {
            const data = {
                cateId: query.cateId,
                limit: query.limit || 30,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/api/djradio/hot`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_program_toplist_hours',

        route: '/dj/program/toplist/hours',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100
                // 不支持 offset
            }
            return request('POST', `https://music.163.com/api/djprogram/toplist/hours`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_program_toplist',

        route: '/dj/program/toplist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 100,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/api/program/toplist/v1`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_program_detail',

        route: '/dj/program/detail',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/api/dj/program/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_program',

        route: '/dj/program',

        module: (query, request) => {
            const data = {
                radioId: query.rid,
                limit: query.limit || 30,
                offset: query.offset || 0,
                asc: toBoolean(query.asc)
            }
            return request('POST', `https://music.163.com/weapi/dj/program/byradio`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_personalize_recommend',

        route: '/dj/personalize/recommend',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/api/djradio/personalize/rcmd`,
                {
                    limit: query.limit || 6
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_paygift',

        route: '/dj/paygift',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/home/paygift/list?_nmclfl=1`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_hot',

        route: '/dj/hot',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/djradio/hot/v1`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_detail',

        route: '/dj/detail',

        module: (query, request) => {
            const data = {
                id: query.rid
            }
            return request('POST', `https://music.163.com/api/djradio/v2/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'dj_catelist',

        route: '/dj/catelist',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/category/get`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_category_recommend',

        route: '/dj/category/recommend',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/home/category/recommend`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_category_excludehot',

        route: '/dj/category/excludehot',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/category/excludehot`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'dj_banner',

        route: '/dj/banner',

        module: (query, request) => {
            // const data = {}
            query.cookie.os = 'pc'
            return request(
                'POST',
                `https://music.163.com/weapi/djradio/banner/get`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'digitalAlbum_sales',

        route: '/digitalAlbum/sales',

        module: (query, request) => {
            const data = {
                albumIds: query.ids
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipmall/albumproduct/album/query/sales`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'digitalAlbum_purchased',

        route: '/digitalAlbum/purchased',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/api/digitalAlbum/purchased`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'digitalAlbum_ordering',

        route: '/digitalAlbum/ordering',

        module: (query, request) => {
            const data = {
                business: 'Album',
                paymentMethod: query.payment,
                digitalResources: JSON.stringify([
                    {
                        business: 'Album',
                        resourceID: query.id,
                        quantity: query.quantity
                    }
                ]),
                from: 'web'
            }
            return request('POST', `https://music.163.com/api/ordering/web/digital`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'digitalAlbum_detail',

        route: '/digitalAlbum/detail',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipmall/albumproduct/detail`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'daily_signin',

        route: '/daily_signin',

        module: (query, request) => {
            const data = {
                type: query.type || 0
            }
            return request('POST', `https://music.163.com/weapi/point/dailyTask`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'creator_authinfo_get',

        route: '/creator/authinfo/get',

        module: (query, request) => {
            const data = {}
            return request(
                'POST',
                `https://interface.music.163.com/weapi/user/creator/authinfo/get`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/user/creator/authinfo/get'
                }
            )
        }
    },

    {
        identifier: 'countries_code_list',

        route: '/countries/code/list',

        module: (query, request) => {
            const data = {}
            return request('POST', `https://interface3.music.163.com/eapi/lbs/countries/v1`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                url: '/api/lbs/countries/v1',
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'comment_video',

        route: '/comment/video',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/comments/R_VI_62_${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_playlist',

        route: '/comment/playlist',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/comments/A_PL_0_${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_new',

        route: '/comment/new',

        module: (query, request) => {
            query.cookie.os = 'pc'
            query.type = resourceTypeMap[query.type]
            const threadId = query.type + query.id
            const pageSize = query.pageSize || 20
            const pageNo = query.pageNo || 1
            let sortType = Number(query.sortType) || 99
            if (sortType === 1) {
                sortType = 99
            }
            let cursor = ''
            switch (sortType) {
                case 99:
                    cursor = (pageNo - 1) * pageSize
                    break
                case 2:
                    cursor = 'normalHot#' + (pageNo - 1) * pageSize
                    break
                case 3:
                    cursor = query.cursor || '0'
                    break
                default:
                    break
            }
            const data = {
                threadId: threadId,
                pageNo,
                showInner: query.showInner || true,
                pageSize,
                cursor: cursor,
                sortType: sortType //99:按推荐排序,2:按热度排序,3:按时间排序
            }
            return request('POST', `https://music.163.com/api/v2/resource/comments`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/v2/resource/comments'
            })
        }
    },

    {
        identifier: 'comment_mv',

        route: '/comment/mv',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/comments/R_MV_5_${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_music',

        route: '/comment/music',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/api/v1/resource/comments/R_SO_4_${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_like',

        route: '/comment/like',

        module: (query, request) => {
            query.cookie.os = 'pc'
            query.t = query.t == 1 ? 'like' : 'unlike'
            query.type = resourceTypeMap[query.type]
            const data = {
                threadId: query.type + query.id,
                commentId: query.cid
            }
            if (query.type == 'A_EV_2_') {
                data.threadId = query.threadId
            }
            return request('POST', `https://music.163.com/weapi/v1/comment/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'comment_hug_list',

        route: '/comment/hug/list',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            query.type = resourceTypeMap[query.type || 0]
            const threadId = query.type + query.sid
            const data = {
                targetUserId: query.uid,
                commentId: query.cid,
                cursor: query.cursor || '-1',
                threadId: threadId,
                pageNo: query.page || 1,
                idCursor: query.idCursor || -1,
                pageSize: query.pageSize || 100
            }
            return request(
                'POST',
                `https://music.163.com/api/v2/resource/comments/hug/list`,
                data,
                {
                    crypto: 'api',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_hot',

        route: '/comment/hot',

        module: (query, request) => {
            query.cookie.os = 'pc'
            query.type = resourceTypeMap[query.type]
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/hotcomments/${query.type}${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_floor',

        route: '/comment/floor',

        module: (query, request) => {
            query.type = resourceTypeMap[query.type]
            const data = {
                parentCommentId: query.parentCommentId,
                threadId: query.type + query.id,
                time: query.time || -1,
                limit: query.limit || 20
            }
            return request('POST', `https://music.163.com/api/resource/comment/floor/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'comment_event',

        route: '/comment/event',

        module: (query, request) => {
            const data = {
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/comments/${query.threadId}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_dj',

        route: '/comment/dj',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/comments/A_DJ_1_${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment_album',

        route: '/comment/album',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                rid: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0,
                beforeTime: query.before || 0
            }
            return request(
                'POST',
                `https://music.163.com/weapi/v1/resource/comments/R_AL_3_${query.id}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'comment',

        route: '/comment',

        module: (query, request) => {
            query.cookie.os = 'android'
            query.t = {
                1: 'add',
                0: 'delete',
                2: 'reply'
            }[query.t]
            query.type = resourceTypeMap[query.type]
            const data = {
                threadId: query.type + query.id
            }

            if (query.type == 'A_EV_2_') {
                data.threadId = query.threadId
            }
            if (query.t == 'add') data.content = query.content
            else if (query.t == 'delete') data.commentId = query.commentId
            else if (query.t == 'reply') {
                data.commentId = query.commentId
                data.content = query.content
            }
            return request(
                'POST',
                `https://music.163.com/weapi/resource/comments/${query.t}`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'cloud_match',

        route: '/cloud/match',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                userId: query.uid,
                songId: query.sid,
                adjustSongId: query.asid
            }
            return request('POST', `https://music.163.com/api/cloud/user/song/match`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'cloudsearch',

        route: '/cloudsearch',

        module: (query, request) => {
            const data = {
                s: query.keywords,
                type: query.type || 1, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://interface.music.163.com/eapi/cloudsearch/pc`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                url: '/api/cloudsearch/pc',
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'cloud',

        route: '/cloud',

        module: async (query, request) => {
            let ext = 'mp3'
            if (query.songFile.name.indexOf('flac') > -1) {
                ext = 'flac'
            }
            const filename = query.songFile.name
                .replace('.' + ext, '')
                .replace(/\s/g, '')
                .replace(/\./g, '_')
            query.cookie.os = 'pc'
            query.cookie.appver = '2.9.7'
            const bitrate = 999000
            if (!query.songFile) {
                return Promise.reject({
                    status: 500,
                    body: {
                        msg: '请上传音乐文件',
                        code: 500
                    }
                })
            }
            if (!query.songFile.md5) {
                // 命令行上传没有md5和size信息,需要填充
                query.songFile.md5 = md5(query.songFile.data)
                query.songFile.size = query.songFile.data.byteLength
            }
            const res = await request(
                'POST',
                `https://interface.music.163.com/api/cloud/upload/check`,
                {
                    bitrate: String(bitrate),
                    ext: '',
                    length: query.songFile.size,
                    md5: query.songFile.md5,
                    songId: '0',
                    version: 1
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            let artist = ''
            let album = ''
            let songName = ''
            try {
                const metadata = await mm.parseBuffer(query.songFile.data, query.songFile.mimetype)
                const info = metadata.common

                if (info.title) {
                    songName = info.title
                }
                if (info.album) {
                    album = info.album
                }
                if (info.artist) {
                    artist = info.artist
                }
                // if (metadata.native.ID3v1) {
                // metadata.native.ID3v1.forEach((item) => {
                // // console.log(item.id, item.value)
                // if (item.id === 'title') {
                // songName = item.value
                // }
                // if (item.id === 'artist') {
                // artist = item.value
                // }
                // if (item.id === 'album') {
                // album = item.value
                // }
                // })
                // // console.log({
                // // songName,
                // // album,
                // // songName,
                // // })
                // }
                // console.log({
                // songName,
                // album,
                // songName,
                // })
            } catch (error) {
                console.log(error)
            }
            const tokenRes = await request(
                'POST',
                `https://music.163.com/weapi/nos/token/alloc`,
                {
                    bucket: '',
                    ext: ext,
                    filename: filename,
                    local: false,
                    nos_product: 3,
                    type: 'audio',
                    md5: query.songFile.md5
                },
                { crypto: 'weapi', cookie: query.cookie, proxy: query.proxy }
            )

            if (res.body.needUpload) {
                await uploadPlugin(query, request)
                // console.log('uploadInfo', uploadInfo.body.result.resourceId)
            }
            // console.log(tokenRes.body.result)
            const res2 = await request(
                'POST',
                `https://music.163.com/api/upload/cloud/info/v2`,
                {
                    md5: query.songFile.md5,
                    songid: res.body.songId,
                    filename: query.songFile.name,
                    song: songName || filename,
                    album: album || '未知专辑',
                    artist: artist || '未知艺术家',
                    bitrate: String(bitrate),
                    resourceId: tokenRes.body.result.resourceId
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            // console.log({ res2, privateCloud: res2.body.privateCloud })
            // console.log(res.body.songId, 'songid')
            const res3 = await request(
                'POST',
                `https://interface.music.163.com/api/cloud/pub/v2`,
                {
                    songid: res2.body.songId
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            // console.log({ res3 })
            return {
                status: 200,
                body: {
                    ...res.body,
                    ...res3.body
                    // ...uploadInfo,
                },
                cookie: res.cookie
            }
        }
    },

    {
        identifier: 'check_music',

        route: '/check/music',

        module: (query, request) => {
            const data = {
                ids: '[' + parseInt(query.id) + ']',
                br: parseInt(query.br || 999000)
            }
            return request('POST', `https://music.163.com/weapi/song/enhance/player/url`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            }).then((response) => {
                let playable = false
                if (response.body.code == 200) {
                    if (response.body.data[0].code == 200) {
                        playable = true
                    }
                }
                if (playable) {
                    response.body = { code: 200, success: true, message: 'ok' }
                    return response
                } else {
                    // response.status = 404
                    response.body = { code: 200, success: false, message: '亲爱的,暂无版权' }
                    return response
                    // return Promise.reject(response)
                }
            })
        }
    },

    {
        identifier: 'cellphone_existence_check',

        route: '/cellphone/existence/check',

        module: (query, request) => {
            const data = {
                cellphone: query.phone,
                countrycode: query.countrycode
            }
            return request('POST', `https://music.163.com/eapi/cellphone/existence/check`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                url: '/api/cellphone/existence/check',
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'captcha_verify',

        route: '/captcha/verify',

        module: (query, request) => {
            const data = {
                ctcode: query.ctcode || '86',
                cellphone: query.phone,
                captcha: query.captcha
            }
            return request('POST', `https://music.163.com/weapi/sms/captcha/verify`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'captcha_sent',

        route: '/captcha/sent',

        module: (query, request) => {
            const data = {
                ctcode: query.ctcode || '86',
                cellphone: query.phone
            }
            return request('POST', `https://music.163.com/api/sms/captcha/sent`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'calendar',

        route: '/calendar',

        module: (query, request) => {
            const data = {
                startTime: query.startTime || Date.now(),
                endTime: query.endTime || Date.now()
            }
            return request('POST', `https://music.163.com/api/mcalendar/detail`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'batch',

        route: '/batch',

        module: (query, request) => {
            const data = {
                e_r: true
            }
            Object.keys(query).forEach((i) => {
                if (/^\/api\//.test(i)) {
                    data[i] = query[i]
                }
            })
            return request('POST', `https://music.163.com/eapi/batch`, data, {
                crypto: 'eapi',
                proxy: query.proxy,
                url: '/api/batch',
                cookie: query.cookie,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'banner',

        route: '/banner',

        module: (query, request) => {
            const type =
                {
                    0: 'pc',
                    1: 'android',
                    2: 'iphone',
                    3: 'ipad'
                }[query.type || 0] || 'pc'
            return request(
                'POST',
                `https://music.163.com/api/v2/banner/get`,
                { clientType: type },
                { crypto: 'api', proxy: query.proxy, realIP: query.realIP }
            )
        }
    },

    {
        identifier: 'avatar_upload',

        route: '/avatar/upload',

        module: async (query, request) => {
            const uploadInfo = await uploadPlugin(query, request)
            const res = await request(
                'POST',
                `https://music.163.com/weapi/user/avatar/upload/v1`,
                {
                    imgid: uploadInfo.imgId
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
            return {
                status: 200,
                body: {
                    code: 200,
                    data: {
                        ...uploadInfo,
                        ...res.body
                    }
                }
            }
        }
    },

    {
        identifier: 'audio_match',

        route: '/audio/match',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                algorithmCode: 'shazam_v2',
                times: 1,
                sessionId: createRandomString(16),
                duration: Number(query.duration),
                from: 'recognize-song',
                decrypt: '1',
                rawdata: query.audioFP
            }
            return request('POST', `https://music.163.com/api/music/audio/match`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_video',

        route: '/artist/video',

        module: (query, request) => {
            const data = {
                artistId: query.id,
                page: JSON.stringify({
                    size: query.size || 10,
                    cursor: query.cursor || 0
                }),
                tab: 0,
                order: query.order || 0
            }
            return request('POST', `https://music.163.com/weapi/mlog/artist/video`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_top_song',

        route: '/artist/top/song',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/api/artist/top/song`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_sublist',

        route: '/artist/sublist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 25,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/artist/sublist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_sub',

        route: '/artist/sub',

        module: (query, request) => {
            query.t = Number(query.t) === 1 ? 'sub' : 'unsub'
            const data = {
                artistId: query.id,
                artistIds: '[' + query.id + ']'
            }
            return request('POST', `https://music.163.com/weapi/artist/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_songs',

        route: '/artist/songs',

        module: (query, request) => {
            query.cookie.os = 'pc'
            const data = {
                id: query.id,
                private_cloud: 'true',
                work_type: 1,
                order: query.order || 'hot', //hot,time
                offset: query.offset || 0,
                limit: query.limit || 100
            }
            return request('POST', `https://music.163.com/api/v1/artist/songs`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_new_song',

        route: '/artist/new/song',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                limit: query.limit || 20,
                startTimestamp: query.before || Date.now()
            }
            return request(
                'POST',
                `https://music.163.com/api/sub/artist/new/works/song/list`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'artist_new_mv',

        route: '/artist/new/mv',

        module: (query, request) => {
            query.cookie.os = 'ios'
            query.cookie.appver = '8.7.01'
            const data = {
                limit: query.limit || 20,
                startTimestamp: query.before || Date.now()
            }
            return request('POST', `https://music.163.com/api/sub/artist/new/works/mv/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_mv',

        route: '/artist/mv',

        module: (query, request) => {
            const data = {
                artistId: query.id,
                limit: query.limit,
                offset: query.offset,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/artist/mvs`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_list',

        route: '/artist/list',

        module: (query, request) => {
            const data = {
                initial: isNaN(query.initial)
                    ? (query.initial || '').toUpperCase().charCodeAt() || undefined
                    : query.initial,
                offset: query.offset || 0,
                limit: query.limit || 30,
                total: true,
                type: query.type || '1',
                area: query.area
            }
            return request('POST', `https://music.163.com/api/v1/artist/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_follow_count',

        route: '/artist/follow/count',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/weapi/artist/follow/count/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_fans',

        route: '/artist/fans',

        module: (query, request) => {
            const data = {
                id: query.id,
                limit: query.limit || 20,
                offset: query.offset || 0
            }
            return request('POST', `https://music.163.com/weapi/artist/fans/get`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_detail',

        route: '/artist/detail',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/api/artist/head/info/get`,
                {
                    id: query.id
                },
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'artist_desc',

        route: '/artist/desc',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/weapi/artist/introduction`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artist_album',

        route: '/artist/album',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/artist/albums/${query.id}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'artists',

        route: '/artists',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/v1/artist/${query.id}`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'album_sublist',

        route: '/album/sublist',

        module: (query, request) => {
            const data = {
                limit: query.limit || 25,
                offset: query.offset || 0,
                total: true
            }
            return request('POST', `https://music.163.com/weapi/album/sublist`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'album_sub',

        route: '/album/sub',

        module: (query, request) => {
            query.t = query.t == 1 ? 'sub' : 'unsub'
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/api/album/${query.t}`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'album_songsaleboard',

        route: '/album/songsaleboard',

        module: (query, request) => {
            let data = {
                albumType: query.albumType || 0 //0为数字专辑,1为数字单曲
            }
            const type = query.type || 'daily' // daily,week,year,total
            if (type === 'year') {
                data = {
                    ...data,
                    year: query.year
                }
            }
            return request(
                'POST',
                `https://music.163.com/api/feealbum/songsaleboard/${type}/type`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'album_newest',

        route: '/album/newest',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/api/discovery/newAlbum`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'album_new',

        route: '/album/new',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true,
                area: query.area || 'ALL' //ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
            }
            return request('POST', `https://music.163.com/weapi/album/new`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'album_list_style',

        route: '/album/list/style',

        module: (query, request) => {
            const data = {
                limit: query.limit || 10,
                offset: query.offset || 0,
                total: true,
                area: query.area || 'Z_H' //Z_H:华语,E_A:欧美,KR:韩国,JP:日本
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipmall/appalbum/album/style`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'album_list',

        route: '/album/list',

        module: (query, request) => {
            const data = {
                limit: query.limit || 30,
                offset: query.offset || 0,
                total: true,
                area: query.area || 'ALL', //ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
                type: query.type
            }
            return request('POST', `https://music.163.com/weapi/vipmall/albumproduct/list`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'album_detail_dynamic',

        route: '/album/detail/dynamic',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request('POST', `https://music.163.com/api/album/detail/dynamic`, data, {
                crypto: 'weapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP
            })
        }
    },

    {
        identifier: 'album_detail',

        route: '/album/detail',

        module: (query, request) => {
            const data = {
                id: query.id
            }
            return request(
                'POST',
                `https://music.163.com/weapi/vipmall/albumproduct/detail`,
                data,
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'album',

        route: '/album',

        module: (query, request) => {
            return request(
                'POST',
                `https://music.163.com/weapi/v1/album/${query.id}`,
                {},
                {
                    crypto: 'weapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP
                }
            )
        }
    },

    {
        identifier: 'aidj_content_rcmd',

        route: '/aidj/content/rcmd',

        module: (query, request) => {
            const extInfo = {}
            if (query.latitude != undefined) {
                extInfo.lbsInfoList = [
                    {
                        lat: query.latitude,
                        lon: query.longitude,
                        time: Date.parse(new Date()) / 1000
                    }
                ]
            }
            extInfo.noAidjToAidj = false
            extInfo.lastRequestTimestamp = new Date().getTime()
            extInfo.listenedTs = false
            const data = {
                extInfo: JSON.stringify(extInfo)
            }
            console.log(data)
            return request(
                'POST',
                `https://interface3.music.163.com/eapi/aidj/content/rcmd/info`,
                data,
                {
                    crypto: 'eapi',
                    cookie: query.cookie,
                    proxy: query.proxy,
                    realIP: query.realIP,
                    url: '/api/aidj/content/rcmd/info'
                }
            )
        }
    },

    {
        identifier: 'activate_init_profile',

        route: '/activate/init/profile',

        module: (query, request) => {
            const data = {
                nickname: query.nickname
            }
            return request('POST', `https://music.163.com/eapi/activate/initProfile`, data, {
                crypto: 'eapi',
                cookie: query.cookie,
                proxy: query.proxy,
                realIP: query.realIP,
                url: '/api/activate/initProfile'
            })
        }
    }
]

export default modules

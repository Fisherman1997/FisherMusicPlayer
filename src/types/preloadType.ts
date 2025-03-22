import { controlWindowType } from './mainType'
import { RequestResponse } from './requestResponse'

export const ApiUrls = [
    '/yunbei/today',

    '/yunbei/task/finish',

    '/yunbei/tasks/todo',

    '/yunbei/tasks',

    '/yunbei/sign',

    '/yunbei/receipt',

    '/yunbei/rcmd/song/history',

    '/yunbei/rcmd/song',

    '/yunbei/info',

    '/yunbei/expense',

    '/yunbei',

    '/weblog',

    '/voice/upload',

    '/voice/detail',

    '/voicelist/search',

    '/voicelist/list',

    '/vip/timemachine',

    '/vip/tasks',

    '/vip/info/v2',

    '/vip/info',

    '/vip/growthpoint/get',

    '/vip/growthpoint/details',

    '/vip/growthpoint',

    '/video/url',

    '/video/timeline/recommend',

    '/video/timeline/all',

    '/video/sub',

    '/video/group/list',

    '/video/group',

    '/video/detail/info',

    '/video/detail',

    '/video/category/list',

    '/verify/qrcodestatus',

    '/verify/getQr',

    '/user/update',

    '/user/subcount',

    '/user/replacephone',

    '/user/record',

    '/user/playlist',

    '/user/level',

    '/user/follows',

    '/user/followeds',

    '/user/event',

    '/user/dj',

    '/user/detail',

    '/user/comment/history',

    '/user/cloud/detail',

    '/user/cloud/del',

    '/user/cloud',

    '/user/bindingcellphone',

    '/user/binding',

    '/user/audio',

    '/user/account',

    '/ugc/user/devote',

    '/ugc/song/get',

    '/ugc/mv/get',

    '/ugc/detail',

    '/ugc/artist/search',

    '/ugc/artist/get',

    '/ugc/album/get',

    '/top/song',

    '/top/playlist/highquality',

    '/top/playlist',

    '/top/mv',

    '/top/list',

    '/top/artists',

    '/top/album',

    '/toplist/detail',

    '/toplist/artist',

    '/toplist',

    '/topic/sublist',

    '/topic/detail/event/hot',

    '/topic/detail',

    '/threshold/detail/get',

    '/summary/annual',

    '/style/song',

    '/style/preference',

    '/style/playlist',

    '/style/list',

    '/style/detail',

    '/style/artist',

    '/style/album',

    '/starpick/comments/summary',

    '/song/wiki/summary',

    '/song/url/v1',

    '/song/url',

    '/song/purchased',

    '/song/order/update',

    '/song/download/url',

    '/song/detail',

    '/simi/user',

    '/simi/song',

    '/simi/playlist',

    '/simi/mv',

    '/simi/artist',

    '/sign/happy/info',

    '/signin/progress',

    '/sheet/preview',

    '/sheet/list',

    '/share/resource',

    '/setting',

    '/send/text',

    '/send/song',

    '/send/playlist',

    '/send/album',

    '/search/suggest',

    '/search/multimatch',

    '/search/hot/detail',

    '/search/hot',

    '/search/default',

    '/search',

    '/scrobble',

    '/resource/like',

    '/related/playlist',

    '/related/allvideo',

    '/register/cellphone',

    '/register/anonimous',

    '/record/recent/voice',

    '/record/recent/video',

    '/record/recent/song',

    '/record/recent/playlist',

    '/record/recent/dj',

    '/record/recent/album',

    '/recommend/songs',

    '/recommend/resource',

    '/rebind',

    '/program/recommend',

    '/pl/count',

    '/playmode/song/vector',

    '/playmode/intelligence/list',

    '/playlist/video/recent',

    '/playlist/update/playcount',

    '/playlist/update',

    '/playlist/track/delete',

    '/playlist/track/all',

    '/playlist/track/add',

    '/playlist/tracks',

    '/playlist/tags/update',

    '/playlist/subscribers',

    '/playlist/subscribe',

    '/playlist/privacy',

    '/playlist/order/update',

    '/playlist/name/update',

    '/playlist/mylike',

    '/playlist/hot',

    '/playlist/highquality/tags',

    '/playlist/detail/dynamic',

    '/playlist/detail',

    '/playlist/desc/update',

    '/playlist/delete',

    '/playlist/create',

    '/playlist/cover/update',

    '/playlist/catlist',

    '/personal_fm',

    '/personalized/privatecontent/list',

    '/personalized/privatecontent',

    '/personalized/newsong',

    '/personalized/mv',

    '/personalized/djprogram',

    '/personalized',

    '/nickname/check',

    '/mv/url',

    '/mv/sublist',

    '/mv/sub',

    '/mv/first',

    '/mv/exclusive/rcmd',

    '/mv/detail/info',

    '/mv/detail',

    '/mv/all',

    '/music/first/listen/info',

    '/musician/tasks/new',

    '/musician/tasks',

    '/musician/sign',

    '/musician/play/trend',

    '/musician/data/overview',

    '/musician/cloudbean/obtain',

    '/musician/cloudbean',

    '/msg/recentcontact',

    '/msg/private/history',

    '/msg/private',

    '/msg/notices',

    '/msg/forwards',

    '/msg/comments',

    '/mlog/url',

    '/mlog/to/video',

    '/mlog/music/rcmd',

    '/lyric/new',

    '/lyric',

    '/logout',

    '/login/status',

    '/login/refresh',

    '/login/qr/key',

    '/login/qr/create',

    '/login/qr/check',

    '/login/cellphone',

    '/login',

    '/listentogether/sync/playlist/get',

    '/listentogether/sync/list/command',

    '/listentogether/status',

    '/listentogether/room/create',

    '/listentogether/room/check',

    '/listentogether/play/command',

    '/listentogether/heatbeat',

    '/listentogether/end',

    '/likelist',

    '/like',

    '/inner/version',

    '/hug/comment',

    '/hot/topic',

    '/homepage/dragon/ball',

    '/homepage/block/page',

    '/history/recommend/songs/detail',

    '/history/recommend/songs',

    '/get/userids',

    '/follow',

    '/fm_trash',

    '/fanscenter/trend/list',

    '/fanscenter/overview/get',

    '/fanscenter/basicinfo/province/get',

    '/fanscenter/basicinfo/gender/get',

    '/fanscenter/basicinfo/age/get',

    '/event/forward',

    '/event/del',

    '/event',

    '/dj/toplist/popular',

    '/dj/toplist/pay',

    '/dj/toplist/newcomer',

    '/dj/toplist/hours',

    '/dj/toplist',

    '/dj/today/perfered',

    '/dj/subscriber',

    '/dj/sublist',

    '/dj/sub',

    '/dj/recommend/type',

    '/dj/recommend',

    '/dj/radio/hot',

    '/dj/program/toplist/hours',

    '/dj/program/toplist',

    '/dj/program/detail',

    '/dj/program',

    '/dj/personalize/recommend',

    '/dj/paygift',

    '/dj/hot',

    '/dj/detail',

    '/dj/catelist',

    '/dj/category/recommend',

    '/dj/category/excludehot',

    '/dj/banner',

    '/digitalAlbum/sales',

    '/digitalAlbum/purchased',

    '/digitalAlbum/ordering',

    '/digitalAlbum/detail',

    '/daily_signin',

    '/creator/authinfo/get',

    '/countries/code/list',

    '/comment/video',

    '/comment/playlist',

    '/comment/new',

    '/comment/mv',

    '/comment/music',

    '/comment/like',

    '/comment/hug/list',

    '/comment/hot',

    '/comment/floor',

    '/comment/event',

    '/comment/dj',

    '/comment/album',

    '/comment',

    '/cloud/match',

    '/cloudsearch',

    '/cloud',

    '/check/music',

    '/cellphone/existence/check',

    '/captcha/verify',

    '/captcha/sent',

    '/calendar',

    '/batch',

    '/banner',

    '/avatar/upload',

    '/audio/match',

    '/artist/video',

    '/artist/top/song',

    '/artist/sublist',

    '/artist/sub',

    '/artist/songs',

    '/artist/new/song',

    '/artist/new/mv',

    '/artist/mv',

    '/artist/list',

    '/artist/follow/count',

    '/artist/fans',

    '/artist/detail',

    '/artist/desc',

    '/artist/album',

    '/artists',

    '/album/sublist',

    '/album/sub',

    '/album/songsaleboard',

    '/album/newest',

    '/album/new',

    '/album/list/style',

    '/album/list',

    '/album/detail/dynamic',

    '/album/detail',

    '/album',

    '/aidj/content/rcmd',

    '/activate/init/profile'
] as const

export type requestParams = {
    query?: object
    body?: object
    files?: Buffer[]
}
export interface apiType {
    request: <T>(
        route: (typeof ApiUrls)[number],
        { query, body, files }: requestParams
    ) => Promise<RequestResponse<T>>
    changeWindow: (type: controlWindowType) => void
    getIsMaximized: () => Promise<boolean>
}

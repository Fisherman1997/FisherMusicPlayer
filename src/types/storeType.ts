export type music = {
    id: number
    url: string
    name: string
}

export interface musicStoreType {
    isPlaying: boolean // 播放状态
    playList: Array<music> // 播放列表
    currentMusicId: number | null // 当前播放音乐的 ID
}

import { defineStore } from 'pinia'
import { musicStoreType } from '../../../types/storeType'

export const musicStore = defineStore('music', {
    state: (): musicStoreType => ({
        isPlaying: false,
        playList: [],
        currentMusicId: null
    }),
    getters: {
        // 获取当前播放的音乐
        currentMusic: (state): music | null =>
            state.playList.find((music) => music.id === state.currentMusicId) || null
    },
    actions: {
        // 切换播放状态
        togglePlay() {
            this.isPlaying = !this.isPlaying
        },
        // 添加音乐到播放列表
        addMusicToPlayList(music: music) {
            if (!this.playList.some((item) => item.id === music.id)) {
                this.playList.push(music)
            }
        },
        // 设置当前音乐
        changeCurrentMusic(id: number) {
            this.currentMusicId = id
        },
        // 清空播放列表
        clearPlayList() {
            this.playList = []
            this.currentMusicId = null
        }
    }
})

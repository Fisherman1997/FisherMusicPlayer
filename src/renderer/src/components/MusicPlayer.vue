<template>
    <div class="music-player">
        <h1>Music Player</h1>
        <audio ref="audioPlayer" :src="currentSong" @timeupdate="updateProgress"></audio>
        <div class="progress-bar" @click="seek">
            <div class="progress" :style="{ width: progress + '%' }"></div>
        </div>
        <div>
            <button @click="play">Play</button>
            <button @click="pause">Pause</button>
            <button @click="stop">Stop</button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const audioPlayer = ref<HTMLAudioElement | null>(null)
const currentSong = ref('path/to/your/song.mp3')
const progress = ref(0)

const play = () => {
    if (audioPlayer.value) {
        audioPlayer.value.play()
    }
}

const pause = () => {
    if (audioPlayer.value) {
        audioPlayer.value.pause()
    }
}

const stop = () => {
    if (audioPlayer.value) {
        audioPlayer.value.pause()
        audioPlayer.value.currentTime = 0
        progress.value = 0
    }
}

const updateProgress = () => {
    if (audioPlayer.value) {
        const currentTime = audioPlayer.value.currentTime
        const duration = audioPlayer.value.duration
        if (duration > 0) {
            progress.value = (currentTime / duration) * 100
        }
    }
}

const seek = (event: MouseEvent) => {
    if (audioPlayer.value) {
        const progressBar = event.currentTarget as HTMLElement
        const rect = progressBar.getBoundingClientRect()
        const offsetX = event.clientX - rect.left
        const width = progressBar.clientWidth
        audioPlayer.value.currentTime = (offsetX / width) * audioPlayer.value.duration
    }
}

onMounted(() => {
    if (audioPlayer.value) {
        audioPlayer.value.addEventListener('timeupdate', updateProgress)
    }
})
</script>

<style scoped>
.music-player {
    text-align: center;
    margin-top: 50px;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background-color: #ccc;
    cursor: pointer;
    margin: 20px 0;
    position: relative;
}

.progress {
    height: 100%;
    background-color: #42b983;
    width: 0;
}
</style>

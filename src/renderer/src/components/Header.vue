<template>
    <div class="head">
        <div class="title">
            <span>音乐播放器</span>
        </div>
        <div class="right">
            <button :style="{ transform: 'scaleX(0.5)' }" @click="minWindow">一</button>
            <button
                v-if="isMaximized"
                :style="{ transform: 'translateY(-2px) scale(0.8)' }"
                @click="restoreWindow"
            >
                ▣
            </button>
            <button v-else :style="{ transform: 'translateY(-2px) scale(0.8)' }" @click="maxWindow">
                ▭
            </button>
            <button :style="{ 'margin-left': '10px' }" @click="handleClose">×</button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const isMaximized = ref<boolean>(false)
const minWindow = () => window.api.changeWindow('minimize')
const maxWindow = () => window.api.changeWindow('maximize')
const restoreWindow = () => window.api.changeWindow('unmaximize')
window.electron.ipcRenderer.on('isMaximized_win', (_, isMaximizedValue: boolean) => {
    isMaximized.value = isMaximizedValue
})
const handleClose = () => window.api.changeWindow('close')
</script>

<style scoped>
.head {
    padding: 0 15px;
    -webkit-app-region: drag;
    height: 30px;
    background-color: rgb(238, 238, 238);
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.head .title {
    color: #000;
    user-select: none;
    -webkit-app-region: no-drag;
    display: flex;
    align-items: center;
    justify-content: center;
}
.head .right {
    -webkit-app-region: no-drag;
}

.head .right button {
    cursor: pointer;
    margin: 0 5px;
    background: none;
    border: none;
    font-size: 26px;
}
</style>

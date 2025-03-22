<template>
    <Header />
    <div class="main">
        <MusicPlayer />
    </div>
</template>
<script setup lang="ts">
// import { onMounted, ref } from 'vue'
import Header from '@renderer/components/Header.vue'
import MusicPlayer from '@renderer/components/MusicPlayer.vue'
// import { listSongTypes } from '../../types/rendererTypes'

// const list = ref<listSongTypes[]>()
// const loadData = () => {
//     window.api
//         .request<listSongTypes[]>('/personalized/newsong', { query: { limit: 10 } })
//         .then((res) => {
//             console.log(res)
//             if (res.status === 200 && res.body.code === 200) {
//                 list.value = res.body.result
//             }
//         })
//         .catch((err) => {
//             console.log(err)
//         })
// }
//
// onMounted(() => {
//     loadData()
// })
</script>
<style>
.main {
    width: 100vw;
    height: calc(100vh - 30px);
    overflow: hidden;
}
</style>

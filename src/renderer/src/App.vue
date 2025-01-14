<template>
    <Header />
    <div class="main"></div>
</template>
<script setup lang="ts">
import Header from '@renderer/components/Header.vue'
</script>
<style>
.main {
    width: 100vw;
    height: calc(100vh - 30px);
    overflow: hidden;
}
</style>

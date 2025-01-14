import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

function bootstrap() {
    const app = createApp(App)
    app.use(createPinia)
    app.mount('#app')
}

bootstrap()

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'
import './base.css'

import AppShell from './AppShell.vue'
import { appPinia } from './pinia'
import { primeVueOptions } from './primevue'
import router from './router'

const app = createApp(AppShell)

app.use(appPinia)
app.use(PrimeVue, primeVueOptions)
app.use(ToastService)
app.use(router)

app.mount('#app')

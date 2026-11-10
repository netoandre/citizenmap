import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog } from 'quasar'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import '@quasar/extras/material-icons-round/material-icons-round.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import Leaflet css
import 'leaflet/dist/leaflet.css'

import App from './App.vue'
import i18n from './i18n'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
  },
  config: {
    notify: {
      position: 'top-right',
      timeout: 3000,
    },
  },
})

// Initialize auth session
const authStore = useAuthStore()
authStore.initAuth()

app.mount('#app')

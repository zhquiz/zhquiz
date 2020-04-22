import Vue from 'vue'

import App from './App.vue'
import router from './router'

import './plugins/buefy'
import './plugins/fontawesome'
import './plugins/primevue'
import './main.scss'

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
  mounted: () => document.dispatchEvent(new Event('x-app-rendered'))
}).$mount('#app')

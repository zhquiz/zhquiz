import Vue from 'vue'

import App from './App.vue'
import router from './router'

import './assets/tailwind.css'
import './plugins/element'

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
  mounted: () => document.dispatchEvent(new Event('x-app-rendered'))
}).$mount('#app')

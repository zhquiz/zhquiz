import './plugins/buefy'
import './plugins/fontawesome'
import './plugins/vue-context.js'
import './assets/app.css'
import './assets/buefy-mod.css'
import './main.scss'

import Vue from 'vue'

import App from './App.vue'
import Duration from './assets/duration'
import router from './router'
import store from './store'

Vue.config.productionTip = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Vue.filter('format', (v: any) => {
  if (typeof v === 'number') {
    return v || v === 0 ? v.toLocaleString() : ''
  } else if (v instanceof Date) {
    return v.toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  } else if (v && typeof v === 'object') {
    return JSON.stringify(v)
  }
  return v
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Vue.filter('formatDate', (v: any) => {
  return v
    ? new Date(v).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
    : ''
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Vue.filter('duration', (v: any) => {
  return v
    ? new Duration(new Date(v), new Date()).toString({
      sign: false,
      granularity: 2
    })
    : ''
})

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')

import Vue from 'vue'
import firebase from 'firebase/app'
import dayjs from 'dayjs'

import 'firebase/auth'
import 'firebase/analytics'

import App from './App.vue'
import router from './router'
import store from './store'

import './plugins/buefy'
import './plugins/fontawesome'
import './plugins/vue-context'
import './main.scss'

firebase.initializeApp(require('../firebase.config.js'))
firebase.analytics()

firebase.auth().onAuthStateChanged((user) => {
  store.commit('setUser', user)
})

Vue.config.productionTip = false

Vue.filter('format', (v: any) => {
  if (typeof v === 'number') {
    return (v || v === 0) ? v.toLocaleString() : ''
  } else if (v instanceof Date) {
    return dayjs(v).format('YYYY-MM-DD HH:mm')
  } else if (v && typeof v === 'object') {
    return JSON.stringify(v)
  }
  return v
})

Vue.filter('formatDate', (v: any) => {
  return dayjs(v).format('YYYY-MM-DD HH:mm')
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

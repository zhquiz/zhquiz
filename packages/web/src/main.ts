import Vue from 'vue'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/analytics'
import 'firebase/firestore'

import App from './App.vue'
import router from './router'
import store from './store'

import './plugins/buefy'
import './plugins/fontawesome'
import './plugins/primevue'
import './main.scss'

firebase.initializeApp(require('../firebase.config.js'))
firebase.analytics()

firebase.auth().onAuthStateChanged((user) => {
  store.commit('setUser', user)
  if (user && user.email) {
    const email = user.email
    firebase.firestore().collection('user').doc(email).get().then(r => {
      if (!r.data()) {
        firebase.firestore().collection('user').doc(email).set({})
      }
    })
  }
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

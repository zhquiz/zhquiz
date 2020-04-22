import Vue from 'vue'
import Vuex from 'vuex'
import { User } from 'firebase/app'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    user: null as User | null,
    lastStatus: 0
  },
  mutations: {
    setUser (state, user) {
      state.user = user
    },
    removeUser (state) {
      state.user = null
    }
  }
})

export default store

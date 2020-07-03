import { User } from 'firebase/app'
import { ActionTree, MutationTree } from 'vuex'

export const state = () => ({
  user: null as User | null,
  isAuthReady: false,
})

export type RootState = ReturnType<typeof state>

export const mutations: MutationTree<RootState> = {
  updateUser(state, user) {
    state.user = JSON.parse(JSON.stringify(user))
    state.isAuthReady = true
  },
}

export const actions: ActionTree<RootState, RootState> = {
  async updateUser({ commit }, user: User | null) {
    if (user) {
      this.$axios.defaults.headers.authorization = `Bearer ${await user.getIdToken()}`
    } else {
      delete this.$axios.defaults.headers.authorization
    }

    commit('updateUser', user)
  },
}

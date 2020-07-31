import { User } from 'firebase/app'
import { actionTree, getAccessorType, mutationTree } from 'typed-vuex'

export const state = () => ({
  user: null as User | null,
  isAuthReady: false,
  /**
   * This is necessary for layout display
   */
  level: null as number | null,
  levelMin: null as number | null,
})

export type RootState = ReturnType<typeof state>

export const mutations = mutationTree(state, {
  SET_USER(state, user: User | null) {
    state.user = JSON.parse(JSON.stringify(user))
    state.isAuthReady = true
  },
  SET_AUTH_READY(state, ready: boolean) {
    state.isAuthReady = ready
  },
  SET_LEVEL(
    state,
    lv: {
      level: number | null
      levelMin: number | null
    }
  ) {
    state.level = lv.level
    state.levelMin = lv.levelMin
  },
})

export const actions = actionTree(
  { state, mutations },
  {
    async updateUser({ commit }, user: User | null) {
      if (user) {
        this.$axios.defaults.headers.authorization = `Bearer ${await user.getIdToken()}`
        const { level = 1, levelMin = 1 } = await this.$axios.$get(
          '/api/user/',
          {
            params: {
              select: ['level', 'levelMin'],
            },
          }
        )
        commit('SET_LEVEL', { level, levelMin })
      } else {
        await this.$axios.$delete('/api/user/signOut')
        delete this.$axios.defaults.headers.authorization
        commit('SET_LEVEL', { levelMin: null, level: null })
      }

      commit('SET_USER', user)
      commit('SET_AUTH_READY', true)
    },
  }
)

export const accessorType = getAccessorType({
  state,
  mutations,
  actions,
  // modules: {
  //   dictionary,
  // },
})

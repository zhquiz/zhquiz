import { Magic } from 'magic-sdk'
import { actionTree, getAccessorType, mutationTree } from 'typed-vuex'

interface ISettings {
  level: number | null
  levelMin: number | null
  sentenceMin: number | null
  sentenceMax: number | null
}

export const state = () => ({
  settings: {
    level: null,
    levelMin: null,
    sentenceMin: null,
    sentenceMax: null,
  } as ISettings,
  isApp: false,
})

export const mutations = mutationTree(state, {
  SET_SETTINGS(state, settings: ISettings) {
    state.settings = settings
  },
  SET_IS_APP(state, isApp: boolean) {
    state.isApp = isApp
  }
})

export const actions = actionTree(
  { state, mutations },
  {
    async setCredentials({ commit }) {
      let isApp = true

      if (process.browser && process.env.MAGIC_PUBLIC) {
        this.app.$axios.defaults.headers = this.app.$axios.defaults.headers || {}

        const magic = new Magic(process.env.MAGIC_PUBLIC)
        isApp = await magic.user
          .getIdToken()
          .then((token) => {
            this.app.$axios.defaults.headers.Authorization = `Bearer ${token}`
            return true
          })
          .catch(() => {
            delete this.app.$axios.defaults.headers.Authorization
            return false
          })
      }

      commit('SET_IS_APP', isApp)
    },
    async updateSettings({ commit }) {
      const r = await this.app.$axios
        .get('/api/user/', {
          params: {
            select: [
              'level',
              'levelMin',
              'settings.sentence.min',
              'settings.sentence.max',
            ],
          },
        })
        .then((r) => r.data)

      if (!r.level || !r.levelMin) {
        r.level = 3
        r.levelMin = 1

        await this.app.$axios.patch('/api/user', {
          level: r.level,
          levelMin: r.levelMin,
        })
      }

      commit('SET_SETTINGS', {
        level: r.level,
        levelMin: r.levelMin,
        sentenceMin: r['settings.sentence.min'] || null,
        sentenceMax: r['settings.sentence.max'] || null,
      })
    },
  }
)

export const accessorType = getAccessorType({
  state,
  mutations,
  actions,
})

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
  tabs: [] as {
    title: string
    component: string
    permanent?: boolean
    query: Record<string, string>
  }[],
  activeTab: 0,
  identifier: '',
})

export const mutations = mutationTree(state, {
  SET_SETTINGS(state, settings: ISettings) {
    state.settings = settings
  },
  SET_IS_APP(state, isApp: boolean) {
    state.isApp = isApp
  },
  SET_TAB_TITLE(state, { i, title }: { i: number; title: string }) {
    state.tabs[i].title = title
    state.tabs = JSON.parse(JSON.stringify(state.tabs))
  },
  ADD_TAB(
    state,
    {
      component,
      query = {},
      permanent,
    }: {
      component: string
      query?: Record<string, string>
      permanent?: boolean
    }
  ) {
    state.tabs = [
      ...state.tabs,
      {
        title: component,
        component,
        permanent,
        query,
      },
    ]
    state.activeTab = state.tabs.length - 1
  },
  DELETE_TAB(state, { i }: { i: number }) {
    state.tabs.splice(i, 1)

    if (state.activeTab >= state.tabs.length) {
      state.activeTab = state.tabs.length - 1
    }

    state.tabs = JSON.parse(JSON.stringify(state.tabs))
  },
  SET_TAB_COMPONENT(state, { i, component }: { i: number; component: string }) {
    state.tabs[i].component = component

    state.tabs = JSON.parse(JSON.stringify(state.tabs))
    state.activeTab = i
  },
  SET_IDENTIFIER(state, name: string) {
    state.identifier = name
  },
})

export const actions = actionTree(
  { state, mutations },
  {
    async setCredentials({ commit }) {
      let isApp = true

      if (process.browser && process.env.MAGIC_PUBLIC) {
        this.app.$axios.defaults.headers =
          this.app.$axios.defaults.headers || {}

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
        .userGetSettings({
          select: 'level,levelMin,identifer',
        })
        .then((r) => r.data)

      // @ts-ignore
      commit('SET_IDENTIFIER', r.identifier)

      if (!r.level || !r.levelMin) {
        r.level = 10
        r.levelMin = 1

        await this.app.$axios.userUpdateSettings(null, r)
      }

      commit('SET_SETTINGS', {
        level: r.level,
        levelMin: r.levelMin,
        sentenceMin: null,
        sentenceMax: null,
      })
    },
  }
)

export const accessorType = getAccessorType({
  state,
  mutations,
  actions,
})

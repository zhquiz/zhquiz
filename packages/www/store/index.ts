import { magic } from '~/plugins/api'
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
      first,
    }: {
      component: string
      query?: Record<string, string>
      first?: boolean
    }
  ) {
    if (first) {
      state.tabs = [
        {
          title: component,
          component,
          permanent: true,
          query,
        },
      ]
    } else {
      state.tabs = [
        ...state.tabs,
        {
          title: component,
          component,
          query,
        },
      ]
    }

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
  SET_TAB_CURRENT(state, { i }: { i: number }) {
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

      if (magic) {
        this.app.$axios.defaults.headers =
          this.app.$axios.defaults.headers || {}

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
          select: 'level,levelMin,identifier',
        })
        .then((r) => r.data)

      commit('SET_IDENTIFIER', r.identifier!)

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

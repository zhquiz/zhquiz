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
})

export const mutations = mutationTree(state, {
  SET_SETTINGS(state, settings: ISettings) {
    state.settings = settings
  },
})

export const actions = actionTree(
  { state, mutations },
  {
    async updateSettings({ commit }) {
      const r = await this.$axios
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

        await this.$axios.patch('/api/user', {
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

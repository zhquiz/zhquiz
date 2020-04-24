<template lang="pug">
.container#Level
  .field
    label.label Filter
    b-field
      b-radio-button(v-model="whatToShow" native-value="all" type="is-success") Show all
      b-radio-button(v-model="whatToShow" native-value="all-quiz" type="is-info") All quiz
      b-radio-button(v-model="whatToShow" native-value="learning" type="is-warning") Learning
  b-table(:data="shownData" :key="whatToShow")
    template(slot-scope="props")
      b-table-column(field="level" label="Level" width="40") {{props.row.level}}
      b-table-column(field="item" label="Item")
        div
          span.tag.clickable(v-for="t in props.row.item" :key="t"
            :class="getTagClass(t)"
            @contextmenu.prevent="(evt) => { selected = t; $refs.contextmenu.open(evt) }"
          ) {{t}}
  vue-context(ref="contextmenu" lazy)
    li
      a(role="button" @click.prevent="speak(selected)") Speak
    li(v-if="!vocabIds[selected]")
      a(role="button" @click.prevent="addToQuiz(selected, 'vocab')") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(selected, 'vocab')") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: selected } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: selected } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${selected}*`"
        target="_blank" rel="noopener") Open in MDBG
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase from 'firebase/app'
import { AxiosInstance } from 'axios'

import { speak } from '../utils'

@Component
export default class Level extends Vue {
  data = [] as any[]
  selected = ''

  vocabIds: any = {}

  vocabSrsLevel: any = {}
  tagClassMap = [
    (lv: any) => lv > 2 ? 'is-info' : '',
    (lv: any) => lv > 0 ? 'is-success' : '',
    (lv: any) => lv === 0 ? 'is-danger' : ''
  ]

  whatToShow = 'all'

  speak = speak

  get email () {
    const u = this.$store.state.user
    return u ? u.email as string : undefined
  }

  get shownData () {
    const data = JSON.parse(JSON.stringify(this.data)) as any[]
    return data.map((d) => {
      if (this.whatToShow === 'all-quiz' || this.whatToShow === 'learning') {
        d.item = d.item.filter((v: string) => typeof this.vocabSrsLevel[v] !== 'undefined')
      }

      if (this.whatToShow === 'learning') {
        d.item = d.item.filter((v: string) => !(this.vocabSrsLevel[v] > 2))
      }

      return d
    }).filter(({ item }) => item.length > 0)
  }

  async created () {
    await this.onUserChange()
    const api = await this.getApi()
    const r = await api.post('/api/vocab/all')

    this.$set(this, 'data', Object.entries(r.data).map(([lv, vs]) => {
      return { level: parseInt(lv), item: vs }
    }))
  }

  getTagClass (item: string) {
    const srsLevel = this.vocabSrsLevel[item]

    if (typeof srsLevel !== 'undefined') {
      for (const fn of this.tagClassMap) {
        const c = fn(srsLevel)
        if (c) {
          return c
        }
      }

      return 'is-warning'
    }

    return ''
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('email')
  async onUserChange () {
    this.vocabSrsLevel = {}

    if (this.email) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          type: 'vocab'
        },
        join: ['quiz'],
        projection: {
          item: 1,
          srsLevel: 1
        },
        limit: null,
        hasCount: false
      })

      r.data.result.map((data: any) => {
        this.$set(this.vocabSrsLevel, data.item, typeof data.srsLevel === 'number' ? data.srsLevel : null)
      })
    }
  }

  @Watch('selected')
  async loadVocabStatus () {
    if (this.selected) {
      const api = await this.getApi()
      const r = await api.post('/api/card/match', { item: this.selected, type: 'vocab' })
      if (r.data) {
        this.$set(this.vocabIds, this.selected, r.data._id)
        this.$set(this.vocabSrsLevel, this.selected, null)
      } else {
        this.$set(this.vocabIds, this.selected, null)
        this.$set(this.vocabSrsLevel, this.selected, undefined)
      }
    }
  }

  async addToQuiz (item: string, type: string) {
    const api = await this.getApi()
    await api.put('/api/card/', { item, type })
    this.$buefy.snackbar.open(`Added ${type}: ${item} to quiz`)

    this.loadVocabStatus()
  }

  async removeFromQuiz (item: string, type: string) {
    const api = await this.getApi()
    await api.delete('/api/card/', {
      data: { item, type }
    })
    this.$set(this.tagClassMap, item, '')

    this.loadVocabStatus()
  }
}
</script>

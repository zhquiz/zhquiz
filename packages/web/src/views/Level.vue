<template lang="pug">
.container#Level
  b-table(:data="data")
    template(slot-scope="props")
      b-table-column(field="level" label="Level" width="40") {{props.row.level}}
      b-table-column(field="item" label="Item")
        div
          span.tag.clickable(v-for="t in props.row.item" :key="t"
            :class="tagClassMap[t]"
            @contextmenu.prevent="(evt) => { selected = t; $refs.contextmenu.open(evt) }"
          ) {{t}}
  vue-context(ref="contextmenu")
    li
      a(role="button" @click.prevent="speak(selected)") Speak
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
  data = []
  selected = ''

  tagClassMap = {}

  speak = speak

  get email () {
    const u = this.$store.state.user
    return u ? u.email as string : undefined
  }

  async created () {
    await this.onUserChange()
    const api = await this.getApi()
    const r = await api.post('/api/vocab/all')

    this.$set(this, 'data', Object.entries(r.data).map(([lv, vs]) => {
      return { level: parseInt(lv), item: vs }
    }))
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('email')
  async onUserChange () {
    this.tagClassMap = {}

    if (this.email) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          type: 'vocab',
          srsLevel: { $gte: 0 }
        },
        join: ['quiz'],
        projection: {
          item: 1,
          srsLevel: 1
        },
        limit: null
      })

      r.data.map(data => {
        if (data.srsLevel) {
          this.$set(this.tagClassMap, data.item, data.srsLevel < 2 ? 'is-warning' : 'is-success')
        }
      })
    }
  }
}
</script>

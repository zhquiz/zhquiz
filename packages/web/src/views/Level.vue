<template lang="pug">
section#Level
  b-table(:data="data")
    template(slot-scope="props")
      b-table-column(field="level" label="Level" width="40") {{props.row.level}}
      b-table-column(field="item" label="Item")
        div
          span.tag.clickable(v-for="t in props.row.item" :key="t"
            :class="tagClassMap[t]"
            @contextmenu="(evt) => { selected = t; $refs.contextmenu.show(evt) }"
          ) {{t}}
  p-contextmenu(ref="contextmenu" :model="contextmenuItems")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase from 'firebase/app'

import 'firebase/firebase-firestore'
import { speak, api } from '../utils'

@Component
export default class Level extends Vue {
  data = []
  selected = ''

  tagClassMap = {}

  get email () {
    const u = this.$store.state.user
    return u ? u.email as string : undefined
  }

  get contextmenuItems () {
    const v = this.selected

    return [
      {
        label: 'Speak',
        command: () => speak(v)
      },
      {
        label: 'Search for vocab',
        url: this.$router.resolve({
          path: '/vocab',
          query: {
            q: v
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Search for Hanzi',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: v
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Open in MDBG',
        url: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${v}*`,
        target: '_blank'
      }
    ]
  }

  async created () {
    this.onUserChange()

    const { data } = await api.post('/api/vocab/all')
    this.$set(this, 'data', Object.entries<string[]>(data).map(([lv, vs]) => {
      return { level: parseInt(lv), item: vs }
    }))
  }

  @Watch('email')
  async onUserChange () {
    this.tagClassMap = {}

    const r = await firebase.firestore().collection('lesson')
      .where('user', '==', this.email)
      .where('type', '==', 'vocab')
      .where('srsLevel', '>=', 0)
      .get()

    r.docs.map(d => {
      const data = d.data()
      this.$set(this.tagClassMap, data.item, data.srsLevel < 2 ? 'is-warning' : 'is-success')
    })
  }
}
</script>

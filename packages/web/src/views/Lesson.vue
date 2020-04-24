<template lang="pug">
.container#Lesson
  .field
    label.label Types
    .control
      b-checkbox(v-model="types" name="types" native-value="hanzi") Hanzi
      b-checkbox(v-model="types" name="types" native-value="vocab") Vocab
      b-checkbox(v-model="types" name="types" native-value="sentence") Sentence
  b-field(label="Filter with some tags")
    b-taginput(v-model="selectedTags" icon="tag" placeholder="Add a tag"
      :data="filteredTags" autocomplete :allow-new="false" open-on-focus @typing="getFilteredTags")
  b-collapse.card(animation="slide" :open.sync="isTableShown")
    .card-header(slot="trigger" slot-scope="props" role="button")
      p.card-header-title Bookmarked items
      a.card-header-icon
        fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
    .card-content
      b-table(:data="data" @contextmenu="onTableContextmenu")
        template(slot-scope="props")
          b-table-column(field="type" label="Type" width="100") {{props.row.type}}
          b-table-column(field="item" label="Item") {{props.row.item}}
          b-table-column(field="tag" label="Tag")
            b-tag(v-for="t in props.row.tag || []" :key="t") {{t}}
  vue-context(ref="contextmenu")
    li
      a(role="button" @click.prevent="speak(selectedRow.item)") Speak
    li
      a(role="button" @click.prevent="isEditTagModal = true") Edit tags
    li
      a(role="button" @click.prevent="removeItem()") Remove item
  b-modal(:active.sync="isEditTagModal" @close="onEditTagModelClose")
    .card
      .card-header
        .card-header-title Edit tags
      .card-content
        b-taginput(v-model="selectedRow.tag" icon="tag" placeholder="Add a tag"
          :data="filteredTags" autocomplete :allow-new="true" open-on-focus @typing="getFilteredTags")
        .field(style="padding-top: 1em; display: flex; flex-direction: row-reverse;")
          b-button(@click="isEditTagModal = false") Close
  b-loading(:active="isLoading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase from 'firebase/app'
import { AxiosInstance } from 'axios'

import { speak } from '../utils'

@Component
export default class Lesson extends Vue {
  isLoading = false

  selectedTags: string[] = []
  filteredTags: string[] = []
  allTags: string[] = []

  types = ['hanzi', 'vocab', 'sentence']

  data: any[] = []
  isTableShown = false
  page = 1
  count = 0

  selectedRow = {} as any
  isEditTagModal = false

  speak = speak

  get email () {
    const u = this.$store.state.user
    return u ? u.email as string : undefined
  }

  created () {
    this.onUserChange()
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('email')
  async onUserChange () {
    if (this.email) {
      const api = await this.getApi()
      const r = await api.get('/api/user/')
      const data = r.data
      if (data) {
        this.allTags = data.allTags || []
      }

      this.data = []
      this.isLoading = false
      this.load()
    }
  }

  @Watch('types')
  onTypesChange () {
    this.data = []
    this.load()
  }

  @Watch('isTableShown')
  @Watch('selectedTags')
  async load () {
    if (this.isTableShown) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          tag: this.selectedTags
        },
        offset: (this.page - 1) * 10,
        limit: 10
      })

      this.data = r.data.result
      this.count = r.data.count

      this.$set(this, 'data', this.data)
    } else {
      this.page = 1
    }
  }

  getFilteredTags (text: string) {
    this.filteredTags = this.allTags.filter(t => {
      return t.toLocaleLowerCase().startsWith(text.toLocaleLowerCase())
    })
  }

  onTableContextmenu (row: any, evt: MouseEvent) {
    evt.preventDefault()

    this.selectedRow = row
    const contextmenu = this.$refs.contextmenu as any
    contextmenu.open(evt)
  }

  removeItem () {
    this.$buefy.dialog.confirm({
      message: 'Are you sure you want to remove this item?',
      confirmText: 'Remove',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: async () => {
        const api = await this.getApi()
        await api.delete('/api/card/', this.selectedRow)
        this.data = this.data.filter(d => d.id !== this.selectedRow.id)
      }
    })
  }

  async onEditTagModelClose () {
    const api = await this.getApi()
    await api.patch('/api/card/', {
      id: this.selectedRow._id,
      set: this.selectedRow.tag
    })
  }
}
</script>

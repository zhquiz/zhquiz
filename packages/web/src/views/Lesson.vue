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

import 'firebase/firebase-firestore'
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
  lastDataItem = ''
  lastDocs = [] as any[]
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

  @Watch('email')
  async onUserChange () {
    if (this.email) {
      const r = await firebase.firestore().collection('user').doc(this.email).get()
      const data = r.data()
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
  async load (newVal?: any) {
    if (this.isTableShown) {
      let limit = 20

      if (newVal && typeof newVal === 'object') {
        limit = newVal.limit || limit
      }

      if (this.data.length === 0) {
        this.lastDataItem = ''
      }

      let c = firebase.firestore().collection('lesson')
        .where('user', '==', this.email)

      this.selectedTags.map(t => {
        c = c.where('tag', 'array-contains', t)
      })

      c = c.orderBy('updatedAt', 'desc')

      if (this.lastDataItem) {
        c = c.startAfter(this.lastDataItem).limit(limit)
      }

      const { docs } = await c.get()
      const prevLastData = this.lastDataItem

      docs.map(d => {
        const data = d.data()
        if (this.types.includes(data.type)) {
          this.lastDataItem = data.item

          data.id = d.id
          this.data.push(data)
        }
      })

      if (docs.length > this.lastDocs.length && this.lastDataItem === prevLastData) {
        this.lastDocs = docs
        await this.load({ limit: limit + 20 })
      }

      this.lastDocs = []
      this.$set(this, 'data', this.data)
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
        firebase.firestore().collection('lesson').doc(this.selectedRow.id).delete()
        this.data = this.data.filter(d => d.id !== this.selectedRow.id)
      }
    })
  }

  onEditTagModelClose () {
    firebase.firestore().collection('lesson').doc(this.selectedRow.id).update({
      tag: this.selectedRow.tag
    })
  }
}
</script>

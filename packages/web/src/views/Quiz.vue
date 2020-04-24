<template lang="pug">
.container#Quiz
  .columns
    .column.is-4
      .field
        label.label Types
        .control
          b-checkbox(v-model="types" name="types" native-value="hanzi") Hanzi
          b-checkbox(v-model="types" name="types" native-value="vocab") Vocab
          b-checkbox(v-model="types" name="types" native-value="sentence") Sentence
    .column.is-4
      .field
        label.label Filter
        b-field
          b-radio-button(v-model="whatToShow" native-value="all-quiz" type="is-info") All Quiz
          b-radio-button(v-model="whatToShow" native-value="learning" type="is-warning") Learning
    .column.is-4
      b-field(label="Filter by tags")
        b-taginput(v-model="selectedTags" icon="tag" placeholder="Add a tag"
          :data="filteredTags" autocomplete :allow-new="false" open-on-focus @typing="getFilteredTags")
  b-collapse.card(animation="slide" open style="margin-bottom: 1em;")
    .card-header(slot="trigger" slot-scope="props" role="button")
      p.card-header-title Quiz
      a.card-header-icon
        fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
    .card-content
      .columns
        .column.is-3
          span(style="width: 5em; display: inline-block;") Due:
          span {{dueCount}}
        .column.is-3
          span(style="width: 5em; display: inline-block;") New:
          span {{newCount}}
        .column.is-3
          span(style="width: 5em; display: inline-block;") Leech:
          span {{leechCount}}
        .column.is-3(style="display: flex; flex-direction: row;")
          div(style="flex-grow: 1;")
          b-button(type="is-success") Start Quiz
  b-collapse.card(animation="slide" :open.sync="isTableShown")
    .card-header(slot="trigger" slot-scope="props" role="button")
      p.card-header-title {{props.open ? 'Hide items' : 'Show items'}}
      a.card-header-icon
        fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
    .card-content
      b-table(:data="data" @contextmenu="onTableContextmenu"
        paginated :per-page="10"
      )
        template(slot-scope="props")
          b-table-column(field="type" label="Type" width="100" searchable sortable) {{props.row.type}}
          b-table-column(field="item" label="Item" searchable sortable) {{props.row.item}}
          b-table-column(field="tag" label="Tag" searchable)
            b-tag(v-for="t in props.row.tag || []" :key="t") {{t}}
  vue-context(ref="contextmenu" lazy)
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
import { AxiosInstance } from 'axios'

import { speak } from '../utils'

@Component
export default class Quiz extends Vue {
  isLoading = false

  selectedTags: string[] = []
  filteredTags: string[] = []
  allTags: string[] = []

  types = ['hanzi', 'vocab', 'sentence']
  whatToShow = 'learning'

  data: any[] = []
  isTableShown = false

  selectedRow = {} as any
  isEditTagModal = false

  speak = speak

  get email () {
    const u = this.$store.state.user
    return u ? u.email as string : undefined
  }

  get dueCount () {
    const now = +new Date()
    return this.data.filter((d) => d.nextReview && +new Date(d.nextReview) < now).length + this.newCount
  }

  get newCount () {
    return this.data.filter((d) => typeof d.srsLevel === 'undefined').length
  }

  get leechCount () {
    return this.data.filter((d) => d.srsLevel === 0).length
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
  @Watch('selectedTags')
  @Watch('whatToShow')
  async load () {
    let cond: any = {
      tag: this.selectedTags,
      type: { $in: this.types }
    }

    if (this.whatToShow === 'learning') {
      cond = {
        $and: [
          cond,
          {
            $or: [
              {
                srsLevel: { $lt: 2 }
              },
              {
                srsLevel: { $exists: false }
              }
            ]
          }
        ]
      }
    }

    const api = await this.getApi()
    const r = await api.post('/api/card/q', {
      cond,
      join: ['quiz'],
      projection: {
        _id: 1,
        type: 1,
        item: 1,
        tag: 1,
        srsLevel: 1,
        nextReview: 1,
        stat: 1
      },
      limit: null,
      hasCount: false
    })

    this.data = r.data.result

    this.$set(this, 'data', this.data)
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
        await api.delete('/api/card/', {
          data: this.selectedRow
        })
        this.data = this.data.filter(d => d._id !== this.selectedRow._id)
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

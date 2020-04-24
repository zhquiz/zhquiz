<template lang="pug">
.container#Quiz
  .columns
    .column.is-4
      .field
        label.label Type
        .control
          b-checkbox(v-model="type" native-value="hanzi") Hanzi
          b-checkbox(v-model="type" native-value="vocab") Vocab
          b-checkbox(v-model="type" native-value="sentence") Sentence
    .column.is-4
      .field
        label.label Learning stage
        .control
          b-checkbox(v-model="stage" native-value="new") New
          b-checkbox(v-model="stage" native-value="learning") Learning
          b-checkbox(v-model="stage" native-value="graduated") Graduated
    .column.is-4
      .field
        label.label Due
        .control
          b-switch(v-model="isDue") Due only
  .columns
    .column.is-6
      .field
        label.label Direction
        .control
          b-checkbox(v-model="direction" native-value="se") Simplfied-English
          b-checkbox(v-model="direction" native-value="te") Traditional-English
          b-checkbox(v-model="direction" native-value="ec") English-Chinese
    .column.is-6
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
          span {{dueItems.length}}
        .column.is-3
          span(style="width: 5em; display: inline-block;") New:
          span {{newItems.length}}
        .column.is-3
          span(style="width: 5em; display: inline-block;") Leech:
          span {{leechItems.length}}
        .column.is-3(style="display: flex; flex-direction: row;")
          div(style="flex-grow: 1;")
          b-button(type="is-success" @click="startQuiz" :disabled="dueItems.length === 0") Start Quiz
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
          b-table-column(field="direction" label="Direction" searchable sortable)
            span(v-if="props.row.direction === 'ec'") English-Chinese
            span(v-else-if="props.row.direction === 'te'") Traditional-English
            span(v-else) Simplfied-English
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
  b-modal(:active.sync="isQuizModal" @close="endQuiz")
    .card
      .card-content(v-if="quizCurrent")
        .content(v-if="!isQuizShownAnswer" v-html="quizFront" ref="quizFront")
        .content(v-else v-html="quizBack" ref="quizBack")
          h4 {{capitalize(quizCurrent.type)}}
          h3 {{quizCurrent.item}}
      .buttons-area
        .buttons(v-if="!quizCurrent")
          button.button.is-warning(@click="endQuiz") End quiz
        .buttons(v-else-if="!isQuizShownAnswer")
          button.button.is-warning(@click="isQuizShownAnswer = true") Show answer
        div(v-else style="display: flex; flex-direction: column; align-items: center;")
          .buttons
            button.button.is-success(@click="markRight") Right
            button.button.is-danger(@click="markWrong") Wrong
            button.button.is-warning(@click="markRepeat") Repeat
          .buttons
            button.button.is-warning(@click="isQuizShownAnswer = false") Hide answer
            a.button.is-info(target="_blank") Edit
  b-loading(:active="isLoading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { AxiosInstance } from 'axios'

import { speak, shuffle, capitalize } from '../utils'

@Component
export default class Quiz extends Vue {
  isLoading = false

  selectedTags: string[] = []
  filteredTags: string[] = []
  allTags: string[] = []

  type = ['hanzi', 'vocab', 'sentence']
  stage = ['new', 'learning']
  direction = ['se']
  isDue = true

  data: any[] = []
  isTableShown = false

  selectedRow = {} as any
  isEditTagModal = false

  isQuizModal = false
  quizItems: any[] = []
  quizIndex = 0
  isQuizShownAnswer = false

  speak = speak
  capitalize = capitalize

  get email () {
    const u = this.$store.state.user
    return u ? u.email as string : undefined
  }

  get backlogItems () {
    const now = +new Date()
    return this.data.filter((d) => d.nextReview && +new Date(d.nextReview) < now)
  }

  get dueItems () {
    return [
      ...this.backlogItems,
      ...this.newItems
    ]
  }

  get newItems () {
    return this.data.filter((d) => typeof d.srsLevel === 'undefined')
  }

  get leechItems () {
    return this.data.filter((d) => d.srsLevel === 0)
  }

  get quizCurrent () {
    return this.quizItems[this.quizIndex]
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

  @Watch('type')
  @Watch('stage')
  @Watch('direction')
  @Watch('isDue')
  async load () {
    let cond: any = {
      tag: this.selectedTags,
      type: { $in: this.type },
      direction: { $in: this.direction },
      nextReview: this.isDue ? { $lt: { $toDate: new Date() } } : undefined
    }

    cond = {
      $or: [
        this.stage.includes('new') ? {
          ...cond,
          nextReview: { $exists: false }
        } : null,
        this.stage.includes('learning') ? {
          ...cond,
          srsLevel: { $gte: 0 }
        } : null,
        !this.stage.includes('graduated') ? {
          ...cond,
          srsLevel: { $lt: 2 }
        } : null
      ].filter(el => el)
    }

    const api = await this.getApi()
    const r = await api.post('/api/card/q', {
      cond,
      join: ['quiz'],
      projection: {
        _id: 1,
        type: 1,
        item: 1,
        direction: 1,
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

  startQuiz () {
    this.quizItems = shuffle(this.dueItems)
    this.quizIndex = 0
    this.isQuizModal = true
  }

  endQuiz () {
    this.load()
  }

  markRight () {
    this.quizIndex++
  }

  markWrong () {
    this.quizIndex++
  }

  markRepeat () {
    this.quizIndex++
  }
}
</script>

<style lang="scss">
#Quiz {
  .buttons-area {
    min-height: 100px;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;

    .buttons {
      margin-bottom: 0;
    }
  }
}
</style>

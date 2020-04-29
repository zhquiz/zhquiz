<template lang="pug">
#Quiz
  .columns
    .column.is-4
      .field
        label.label Type
        .control
          b-checkbox(v-model="type" native-value="hanzi") Hanzi
          b-checkbox(v-model="type" native-value="vocab") Vocab
          b-checkbox(v-model="type" native-value="sentence") Sentence
          b-checkbox(v-model="type" native-value="extra") Extra
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
        .column.is-3(v-if="!isDue")
          span(style="width: 5em; display: inline-block;") Pending:
          span {{data.length | format}}
        .column.is-3(v-else-if="dueItems.length")
          span(style="width: 5em; display: inline-block;") Due:
          span {{dueItems.length | format}}
        .column.is-3(v-else-if="dueIn")
          span(style="width: 5em; display: inline-block;") Due in:
          span {{dueIn | duration}}
        .column.is-3(v-else)
          span No items due
        .column.is-3
          span(style="width: 5em; display: inline-block;") New:
          span {{newItems.length | format}}
        .column.is-3
          span(style="width: 5em; display: inline-block;") Leech:
          span {{leechItems.length | format}}
        .column.is-3(style="display: flex; flex-direction: row;")
          div(style="flex-grow: 1;")
          b-button(type="is-success" @click="startQuiz" :disabled="data.length === 0") Start Quiz
  b-collapse.card(animation="slide" :open.sync="isTableShown")
    .card-header(slot="trigger" slot-scope="props" role="button")
      p.card-header-title {{props.open ? 'Hide items' : 'Show items'}}
      a.card-header-icon
        fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
    .card-content
      b-table(:data="data" @contextmenu="onTableContextmenu"
        paginated :per-page="10"
        checkable
      )
        template(slot-scope="props")
          b-table-column(field="type" label="Type" width="100" searchable sortable) {{props.row.type}}
          b-table-column(field="item" label="Item" searchable sortable) {{props.row.item}}
          b-table-column(field="direction" label="Direction" searchable sortable)
            span(v-if="props.row.direction === 'ec'") English-Chinese
            span(v-else-if="props.row.direction === 'te'") Traditional-English
            span(v-else-if="props.row.type === 'vocab'") Simplfied-English
            span(v-else) Chinese-English
          b-table-column(field="tag" label="Tag" searchable)
            b-tag(v-for="t in props.row.tag || []" :key="t") {{t}}
          b-table-column(field="srsLevel" label="SRS Level" searchable sortable) {{props.row.srsLevel}}
          b-table-column(field="nextReview" label="Next Review" searchable sortable) {{props.row.nextReview | formatDate}}
  vue-context(ref="contextmenu" lazy)
    li
      a(role="button" @click.prevent="speak(selectedRow.item)") Speak
    li
      a(role="button" @click.prevent="isEditTagModal = true") Edit tags
    li
      a(role="button" @click.prevent="editItem = selectedRow; isEditModal = true") Edit item
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
  b-modal#quiz-modal(:active.sync="isQuizModal" @close="endQuiz")
    .card
      .card-content(v-if="quizCurrent" style="min-height: 100px;")
        .content(v-if="!isQuizShownAnswer" v-html="quizFront" ref="quizFront")
        .content(v-else v-html="quizBack" ref="quizBack")
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
            button.button.is-info(@click="editItem = quizCurrent; isEditModal = true") Edit
  b-modal(:active.sync="isEditModal")
    .card
      .card-content
        b-tabs(type="is-boxed" @change="onEditTabChange")
          b-tab-item(label="Front")
            MarkdownEditor(v-model="editItem.front" :renderer="previewRender" ref="mde0")
          b-tab-item(label="Back")
            MarkdownEditor(v-model="editItem.back" :renderer="previewRender" ref="mde1")
          b-tab-item(label="Mnemonic")
            MarkdownEditor(v-model="editItem.mnemonic" :renderer="previewRender" ref="mde2")
      .card-footer(style="padding: 1em;")
        div(style="flex-grow: 1;")
        .buttons
          button.button.is-success(@click="doEditSave()") Save
          button.button.is-danger(@click="doEditLoad()") Reset
          button.button(@click="isEditModal = false") Close
  b-loading(:active="isLoading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { AxiosInstance } from 'axios'

import { speak, shuffle } from '../utils'
import { markdownToHtml } from '../assets/make-html'
import cardDefault from '../assets/card-default.yaml'
import MarkdownEditor from '../components/MarkdownEditor.vue'

@Component({
  components: {
    MarkdownEditor
  }
})
export default class Quiz extends Vue {
  isLoading = false

  selectedTags: string[] = []
  filteredTags: string[] = []
  allTags: string[] = []

  type = ['hanzi', 'vocab', 'sentence', 'extra']
  stage = ['new', 'learning']
  direction = ['se']
  isDue = true
  dueIn: Date | null = null

  data: any[] = []
  isTableShown = false

  selectedRow = {} as any
  isEditTagModal = false

  isQuizModal = false
  quizItems: any[] = []
  quizIndex = 0
  isQuizShownAnswer = false

  quizFront = ''
  quizBack = ''
  quizMnemonic = ''
  quizData: {
    type: string
    item: string
    raw: any
    cards: {
      _id: string
      direction: string
      front: string
      back: string
      mnemonic: string
    }[]
  }[] = []

  isEditModal = false
  editItem = {
    _id: '',
    front: '',
    back: '',
    mnemonic: '',
    type: '',
    item: '',
    direction: ''
  }

  speak = speak

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

  previewRender (md: string) {
    const { type, item } = this.editItem
    const { raw } = this.quizData.filter((d) => {
      return d.type === type && d.item === item
    })[0] || {}

    return markdownToHtml(md, {
      ...this.editItem,
      raw
    })
  }

  getQuizFront () {
    let template = ''

    if (this.quizCurrent) {
      const { type, item, direction } = this.quizCurrent
      const { raw, cards = [] } = this.quizData.filter((d) => {
        return d.type === type && d.item === item
      })[0] || {}

      const { front } = cards.filter((c) => {
        return c.direction === direction
      })[0] || {}

      template = front || cardDefault[type][direction].front || ''

      return markdownToHtml(template, {
        ...this.quizCurrent,
        raw
      })
    }

    return ''
  }

  getQuizBack () {
    let template = ''

    if (this.quizCurrent) {
      const { type, item, direction } = this.quizCurrent
      const { raw, cards = [] } = this.quizData.filter((d) => {
        return d.type === type && d.item === item
      })[0] || {}

      const { back } = cards.filter((c) => {
        return c.direction === direction
      })[0] || {}

      template = back || cardDefault[type][direction].back || ''

      return markdownToHtml(template, {
        ...this.quizCurrent,
        raw
      })
    }

    return ''
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
  async load (opts?: {
    _dueIn: boolean
  }) {
    let nextReview = undefined as any

    if (opts && opts._dueIn) {
      nextReview = { $exists: true }
    } else if (this.isDue) {
      nextReview = { $lt: { $toDate: new Date().toISOString() } }
    }

    const cond: any = {
      tag: this.selectedTags,
      type: { $in: this.type },
      direction: { $in: this.direction },
      nextReview
    }

    const $and: any = [cond]
    const $or: any = []

    if (this.stage.includes('new')) {
      $or.push({
        ...cond,
        nextReview: { $exists: false }
      })
    } else {
      $or.push(cond)
    }

    if (!this.stage.includes('learning') && !this.stage.includes('graduated')) {
      $and.push({
        srsLevel: { $exists: false }
      })
    } else if (!this.stage.includes('graduated')) {
      $and.push({
        srsLevel: { $lte: 2 }
      })
    } else if (!this.stage.includes('learning')) {
      $and.push({
        srsLevel: { $gt: 2 }
      })
    }

    $or.push({ $and })

    const api = await this.getApi()
    const r = await api.post('/api/card/q', {
      cond: { $or },
      join: ['quiz'],
      projection: (opts && opts._dueIn) ? {
        nextReview: 1
      } : {
        _id: 1,
        type: 1,
        item: 1,
        direction: 1,
        tag: 1,
        srsLevel: 1,
        nextReview: 1,
        stat: 1
      },
      limit: (opts && opts._dueIn) ? 1 : null,
      sort: (opts && opts._dueIn) ? {
        nextReview: 1
      } : undefined,
      hasCount: false
    })

    if (opts && opts._dueIn) {
      return r.data.result
    }

    this.data = r.data.result
    this.$set(this, 'data', this.data)

    this.getDueIn()

    return r.data.result
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
          data: {
            id: this.selectedRow._id
          }
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

  async startQuiz () {
    this.quizItems = shuffle(this.data)
    this.quizIndex = -1
    await this.initNextQuizItem()

    this.isQuizModal = true
  }

  endQuiz () {
    this.isQuizModal = false
    this.load()
  }

  async initNextQuizItem () {
    this.quizIndex++
    this.isQuizShownAnswer = false

    this.quizFront = this.getQuizFront()
    this.quizBack = this.getQuizBack()

    if (this.quizCurrent) {
      await this.cacheQuizItem(this.quizCurrent)

      this.quizFront = this.getQuizFront()
      this.quizBack = this.getQuizBack()
    }
  }

  async cacheQuizItem (target: any) {
    const { type, item, _id } = target
    let data = this.quizData.filter((d) => {
      return d.item === item && d.type === type
    })[0]

    const api = await this.getApi()

    if (!data) {
      const r = await api.post(`/api/${type}/match`, { entry: item })
      data = {
        type,
        item,
        raw: r.data.result,
        cards: []
      }

      this.quizData.push(data)
    }

    let card = data.cards.filter((c) => c._id === _id)[0]
    if (!card) {
      const r = await api.get('/api/quiz/card', {
        params: { id: _id }
      })
      card = r.data

      data.cards.push(card)
    }
  }

  async markRight () {
    const api = await this.getApi()
    await api.patch('/api/quiz/right', {}, {
      params: { id: this.quizCurrent._id }
    })
    this.initNextQuizItem()
  }

  async markWrong () {
    const api = await this.getApi()
    await api.patch('/api/quiz/wrong', {}, {
      params: { id: this.quizCurrent._id }
    })
    this.initNextQuizItem()
  }

  async markRepeat () {
    const api = await this.getApi()
    await api.patch('/api/quiz/repeat', {}, {
      params: { id: this.quizCurrent._id }
    })
    this.initNextQuizItem()
  }

  async doEditSave () {
    const { _id, front, back, mnemonic, type, item, direction } = this.editItem

    const api = await this.getApi()
    await api.patch('/api/card/', {
      id: this.editItem._id,
      set: {
        front,
        back,
        mnemonic
      }
    })

    const { cards = [] } = this.quizData.filter((d) => {
      return d.type === type && d.item === item
    })[0] || {}

    const card = cards.filter((c) => {
      return c.direction === direction
    })[0]

    if (!card) {
      cards.push(this.editItem)
    } else {
      Object.assign(card, this.editItem)
    }
    this.doEditLoad()

    this.$buefy.snackbar.open('Saved')
  }

  @Watch('isEditModal')
  async doEditLoad () {
    if (this.isEditModal) {
      await this.cacheQuizItem(this.editItem)

      const { type, item, direction } = this.editItem
      const { raw: r, cards = [] } = this.quizData.filter((d) => {
        return d.type === type && d.item === item
      })[0] || {}

      const { front, back, mnemonic } = cards.filter((c) => {
        return c.direction === direction
      })[0] || {}

      this.editItem.front = front || cardDefault[type][direction].front || ''
      this.editItem.back = back || cardDefault[type][direction].back || ''
      this.editItem.mnemonic = mnemonic || ''

      // this.$set(this, 'editItem', this.editItem)
      this.$forceUpdate()
    }
  }

  onEditTabChange (i: number) {
    this.$nextTick(() => {
      (this.$refs[`mde${i}`] as any).codemirror.refresh()
    })
  }

  async getDueIn () {
    if (this.dueItems.length > 0) {
      this.dueIn = null
      return
    }

    const it = (await this.load({ _dueIn: true }))[0]
    this.dueIn = it ? it.nextReview : null
  }
}
</script>

<style lang="scss">
#Quiz {
  #quiz-modal {
    .modal-content {
      max-width: 500px !important;

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
  }

  tbody {
    tr:hover {
      cursor: pointer;
      color: blue;
    }
  }
}
</style>

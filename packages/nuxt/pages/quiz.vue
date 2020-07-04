<template>
  <section class="QuizPage">
    <div class="columns">
      <div class="column is-4">
        <div class="field">
          <label class="label">Type</label>
          <div class="control">
            <b-checkbox v-model="type" native-value="hanzi">Hanzi</b-checkbox>
            <b-checkbox v-model="type" native-value="vocab">Vocab</b-checkbox>
            <b-checkbox v-model="type" native-value="sentence">
              Sentence
            </b-checkbox>
            <b-checkbox v-model="type" native-value="extra">Extra</b-checkbox>
          </div>
        </div>
      </div>
      <div class="column is-4">
        <div class="field">
          <label class="label">Learning stage</label>
          <div class="control">
            <b-checkbox v-model="stage" native-value="new">New</b-checkbox>
            <b-checkbox v-model="stage" native-value="learning">
              Learning
            </b-checkbox>
            <b-checkbox v-model="stage" native-value="graduated">
              Graduated
            </b-checkbox>
          </div>
        </div>
      </div>
      <div class="column is-4">
        <div class="field">
          <label class="label">Due</label>
          <div class="control">
            <b-switch v-model="isDue">Due only</b-switch>
          </div>
        </div>
      </div>
    </div>

    <div class="columns">
      <div class="column is-6">
        <div class="field">
          <label class="label">Direction</label>
          <div class="control">
            <b-checkbox v-model="direction" native-value="se">
              Simplified-English
            </b-checkbox>
            <b-checkbox v-model="direction" native-value="te">
              Traditional-English
            </b-checkbox>
            <b-checkbox v-model="direction" native-value="ec">
              English-Chinese
            </b-checkbox>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <b-field label="Filter by tags">
          <b-taginput
            v-model="selectedTags"
            icon="tag"
            placeholder="Add a tag"
            :data="filteredTags"
            autocomplete
            :allow-new="false"
            open-on-focus
            @typing="getFilteredTags"
          />
        </b-field>
      </div>
    </div>

    <b-collapse class="card" animation="slide" open>
      <div slot="trigger" slot-scope="props" class="card-header" role="button">
        <p class="card-header-title">Quiz</p>
        <a role="button" class="card-header-icon">
          <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
        </a>
      </div>
      <div class="card-content">
        <div class="columns">
          <div v-if="!isDue" class="column is-3">
            <span class="column-label">Pending: </span>
            <span>{{ data.length | format }}</span>
          </div>
          <div v-else-if="dueItems.length" class="column is-3">
            <span class="column-label">Due: </span>
            <span>{{ dueItems.length | format }}</span>
          </div>
          <div v-else-if="dueIn" class="column is-3">
            <span class="column-label">Due in: </span>
            <span>{{ dueIn | duration }}</span>
          </div>
          <div v-else class="column is-3">
            <span>No items due</span>
          </div>

          <div class="column is-3">
            <span class="column-label">New: </span>
            <span>{{ newItems.length | format }}</span>
          </div>
          <div class="column is-3">
            <span class="column-label">Leech: </span>
            <span>{{ leechItems.length | format }}</span>
          </div>
          <div class="column is-3 flex flex-row">
            <div class="flex-grow" />
            <b-button
              type="is-success"
              :disabled="data.length === 0"
              @click="startQuiz"
            >
              Start Quiz
            </b-button>
          </div>
        </div>
      </div>
    </b-collapse>

    <b-collapse class="card" animation="slide" :open.sync="isTableShown">
      <div slot="trigger" slot-scope="props" class="card-header" role="button">
        <p class="card-header-title">
          {{ props.open ? 'Hide items' : 'Show items' }}
        </p>
        <a role="button" class="card-header-icon">
          <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
        </a>
      </div>
      <div class="card-content">
        <b-table
          :data="data"
          paginated
          :per-page="10"
          checkable
          @contextmenu="onTableContextmenu"
        >
          <template slot-scope="props">
            <b-table-column
              field="type"
              label="Type"
              width="100"
              searchable
              sortable
            >
              {{ props.row.type }}
            </b-table-column>
            <b-table-column field="item" label="Item" searchable sortable>
              {{ props.row.item }}
            </b-table-column>
            <b-table-column
              field="direction"
              label="Direction"
              searchable
              sortable
            >
              <span v-if="props.row.direction === 'ec'">English-Chinese</span>
              <span v-else-if="props.row.direction === 'te'">
                Traditional-English
              </span>
              <span v-else-if="props.row.type === 'vocab'">
                Simplified-English
              </span>
              <span v-else>Chinese-English</span>
            </b-table-column>
            <b-table-column field="tag" label="Tag" searchable>
              <b-tag v-for="t in props.row.tag || []" :key="t">{{ t }}</b-tag>
            </b-table-column>
            <b-table-column
              field="srsLevel"
              label="SRS Level"
              searchable
              sortable
            >
              {{ props.row.srsLevel }}
            </b-table-column>
            <b-table-column
              field="nextReview"
              label="Next Review"
              searchable
              sortable
            >
              {{ props.row.nextReview | formatDate }}
            </b-table-column>
          </template>
        </b-table>
      </div>
    </b-collapse>

    <b-modal :active.sync="isEditTagModal" @close="onEditTagModelClose">
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">Edit tags</div>
        </div>
        <div class="card-content">
          <b-taginput
            v-model="selectedRow.tag"
            icon="tag"
            placeholder="Add a tag"
            :data="filteredTags"
            autocomplete
            :allow-new="true"
            open-on-focus
            @typing="getFilteredTags"
          />
          <div class="field taginput-field">
            <b-button @click="isEditTagModal = false">Close</b-button>
          </div>
        </div>
      </div>
    </b-modal>

    <b-modal class="quiz-modal" :active.sync="isQuizModal" @close="endQuiz">
      <div class="card">
        <div v-if="quizCurrent" class="card-content">
          <div
            v-show="!isQuizShownAnswer"
            ref="quizFront"
            class="content"
            v-html="quizFront"
          />
          <div
            v-show="isQuizShownAnswer"
            ref="quizBack"
            class="content"
            v-html="quizBack"
          />
        </div>

        <div class="buttons-area">
          <div v-if="!quizCurrent" class="buttons">
            <button
              class="button is-warning"
              @click="endQuiz"
              @keypress="endQuiz"
            >
              End quiz
            </button>
          </div>
          <div v-else-if="!isQuizShownAnswer" class="buttons">
            <button
              class="button is-warning"
              @click="isQuizShownAnswer = true"
              @keypress="isQuizShownAnswer = true"
            >
              Show answer
            </button>
          </div>
          <div class="buttons-panel">
            <div class="buttons">
              <button
                class="button is-success"
                @click="markRight"
                @keypress="markRight"
              >
                Right
              </button>
              <button
                class="button is-danger"
                @click="markWrong"
                @keypress="markWrong"
              >
                Wrong
              </button>
              <button
                class="button is-warning"
                @click="markRepeat"
                @keypress="markRepeat"
              >
                Repeat
              </button>
            </div>

            <div class="buttons">
              <button
                class="button is-warning"
                @click="isQuizShownAnswer = false"
                @keypress="isQuizShownAnswer = false"
              >
                Hide answer
              </button>
              <button
                class="button is-info"
                @click="
                  editItem = quizCurrent
                  isEditModal = true
                "
                @keypress="
                  editItem = quizCurrent
                  isEditModal = true
                "
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </b-modal>

    <b-modal class="edit-modal" :active.sync="isEditModal">
      <div class="card">
        <div class="card-content">
          <b-tabs type="is-boxed" @change="onEditTabChange">
            <b-tab-item label="front">
              <MarkdownEditor
                ref="mde0"
                v-model="editItem.front"
                :renderer="previewRender"
              />
              <MarkdownEditor
                ref="mde1"
                v-model="editItem.back"
                :renderer="previewRender"
              />
              <MarkdownEditor
                ref="mde2"
                v-model="editItem.mnemonic"
                :renderer="previewRender"
              />
            </b-tab-item>
          </b-tabs>
        </div>

        <div class="card-footer">
          <div class="flex-grow" />
          <div class="buttons">
            <button
              class="button is-success"
              @click="doEditSave"
              @keypress="doEditSave"
            >
              Save
            </button>
            <button
              class="button is-danger"
              @click="doEditLoad"
              @keypress="doEditLoad"
            >
              Reset
            </button>
            <button
              class="button"
              @click="isEditModal = false"
              @keypress="isEditModal = false"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </b-modal>

    <b-loading :active="isLoading" />

    <client-only>
      <vue-context ref="contextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="speak(selectedRow.item)"
            @keypress.prevent="speak(selectedRow.item)"
          >
            Speak
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="isEditTagModal = true"
            @keypress.prevent="isEditTagModal = true"
          >
            Edit tags
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="
              editItem = selectedRow
              isEditModal = true
            "
            @keypress.prevent="
              editItem = selectedRow
              isEditModal = true
            "
          >
            Edit item
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="removeItem"
            @keypress.prevent="removeItem"
          >
            Remove item
          </a>
        </li>
      </vue-context>
    </client-only>
  </section>
</template>

<script lang="ts">
import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import hbs from 'handlebars'
import { Component, Vue, Watch } from 'nuxt-property-decorator'

import { shuffle } from '../assets/util'

import cardDefault from '~/assets/card-default.yaml'
import { speak } from '~/assets/speak'

@Component
export default class QuizPage extends Vue {
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
    direction: '',
  }

  speak = speak

  makeHtml = new MakeHtml()

  get email() {
    const u = this.$store.state.user
    return u ? (u.email as string) : undefined
  }

  get backlogItems() {
    const now = +new Date()
    return this.data.filter(
      (d) => d.nextReview && +new Date(d.nextReview) < now
    )
  }

  get dueItems() {
    return [...this.backlogItems, ...this.newItems]
  }

  get newItems() {
    return this.data.filter((d) => typeof d.srsLevel === 'undefined')
  }

  get leechItems() {
    return this.data.filter((d) => d.srsLevel === 0)
  }

  get quizCurrent() {
    return this.quizItems[this.quizIndex]
  }

  created() {
    this.onUserChange()
  }

  markdownToHtml(md: string, ctx: any) {
    return hbs.compile(this.makeHtml.render(md, true))(ctx)
  }

  previewRender(md: string) {
    const { type, item } = this.editItem
    const { raw } =
      this.quizData.filter((d) => {
        return d.type === type && d.item === item
      })[0] || {}

    return this.markdownToHtml(md, {
      ...this.editItem,
      raw,
    })
  }

  getQuizFront() {
    let template = ''

    if (this.quizCurrent) {
      const { type, item, direction } = this.quizCurrent
      const { raw, cards = [] } =
        this.quizData.filter((d) => {
          return d.type === type && d.item === item
        })[0] || {}

      const { front } =
        cards.filter((c) => {
          return c.direction === direction
        })[0] || {}

      template = front || cardDefault[type][direction].front || ''

      return this.markdownToHtml(template, {
        ...this.quizCurrent,
        raw,
      })
    }

    return ''
  }

  getQuizBack() {
    let template = ''

    if (this.quizCurrent) {
      const { type, item, direction } = this.quizCurrent
      const { raw, cards = [] } =
        this.quizData.filter((d) => {
          return d.type === type && d.item === item
        })[0] || {}

      const { back } =
        cards.filter((c) => {
          return c.direction === direction
        })[0] || {}

      template = back || cardDefault[type][direction].back || ''

      return this.markdownToHtml(template, {
        ...this.quizCurrent,
        raw,
      })
    }

    return ''
  }

  @Watch('email')
  async onUserChange() {
    if (this.email) {
      const { allTags } = await this.$axios.$get('/api/user/')
      this.allTags = allTags || []

      this.data = []
      this.isLoading = false
      this.load()
    }
  }

  @Watch('type')
  @Watch('stage')
  @Watch('direction')
  @Watch('isDue')
  async load(opts?: { _dueIn: boolean }) {
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
      nextReview,
    }

    const $and: any = [cond]
    const $or: any = []

    if (this.stage.includes('new')) {
      $or.push({
        ...cond,
        nextReview: { $exists: false },
      })
    } else {
      $or.push(cond)
    }

    if (!this.stage.includes('learning') && !this.stage.includes('graduated')) {
      $and.push({
        srsLevel: { $exists: false },
      })
    } else if (!this.stage.includes('graduated')) {
      $and.push({
        srsLevel: { $lte: 2 },
      })
    } else if (!this.stage.includes('learning')) {
      $and.push({
        srsLevel: { $gt: 2 },
      })
    }

    $or.push({ $and })

    const { result } = await this.$axios.$post('/api/card/q', {
      cond: { $or },
      join: ['quiz'],
      projection:
        opts && opts._dueIn
          ? {
              nextReview: 1,
            }
          : {
              _id: 1,
              type: 1,
              item: 1,
              direction: 1,
              tag: 1,
              srsLevel: 1,
              nextReview: 1,
              stat: 1,
            },
      limit: opts && opts._dueIn ? 1 : null,
      sort:
        opts && opts._dueIn
          ? {
              nextReview: 1,
            }
          : undefined,
      hasCount: false,
    })

    if (opts && opts._dueIn) {
      return result
    }

    this.data = result
    this.$set(this, 'data', this.data)

    this.getDueIn()

    return result
  }

  getFilteredTags(text: string) {
    this.filteredTags = this.allTags.filter((t) => {
      return t.toLocaleLowerCase().startsWith(text.toLocaleLowerCase())
    })
  }

  onTableContextmenu(row: any, evt: MouseEvent) {
    evt.preventDefault()

    this.selectedRow = row
    const contextmenu = this.$refs.contextmenu as any
    contextmenu.open(evt)
  }

  removeItem() {
    this.$buefy.dialog.confirm({
      message: 'Are you sure you want to remove this item?',
      confirmText: 'Remove',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: async () => {
        await this.$axios.$delete('/api/card/', {
          data: {
            id: this.selectedRow._id,
          },
        })
        this.data = this.data.filter((d) => d._id !== this.selectedRow._id)
      },
    })
  }

  async onEditTagModelClose() {
    await this.$axios.$patch('/api/card/', {
      id: this.selectedRow._id,
      set: this.selectedRow.tag,
    })
  }

  async startQuiz() {
    this.quizItems = shuffle(this.data)
    this.quizIndex = -1
    await this.initNextQuizItem()

    this.isQuizModal = true
  }

  endQuiz() {
    this.isQuizModal = false
    this.load()
  }

  async initNextQuizItem() {
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

  async cacheQuizItem(target: any) {
    const { type, item, _id } = target
    let data = this.quizData.filter((d) => {
      return d.item === item && d.type === type
    })[0]

    if (!data) {
      const { result } = await this.$axios.$post(`/api/${type}/match`, {
        entry: item,
      })
      data = {
        type,
        item,
        raw: result,
        cards: [],
      }

      this.quizData.push(data)
    }

    let card = data.cards.filter((c) => c._id === _id)[0]
    if (!card) {
      card = await this.$axios.$get('/api/quiz/card', {
        params: { id: _id },
      })
      data.cards.push(card)
    }
  }

  async markRight() {
    await this.$axios.$patch('/api/quiz/right', undefined, {
      params: { id: this.quizCurrent._id },
    })
    this.initNextQuizItem()
  }

  async markWrong() {
    await this.$axios.$patch('/api/quiz/wrong', undefined, {
      params: { id: this.quizCurrent._id },
    })
    this.initNextQuizItem()
  }

  async markRepeat() {
    await this.$axios.$patch('/api/quiz/repeat', undefined, {
      params: { id: this.quizCurrent._id },
    })
    this.initNextQuizItem()
  }

  async doEditSave() {
    const { front, back, mnemonic, type, item, direction } = this.editItem

    await this.$axios.$patch('/api/card/', {
      id: this.editItem._id,
      set: {
        front,
        back,
        mnemonic,
      },
    })

    const { cards = [] } =
      this.quizData.filter((d) => {
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
  async doEditLoad() {
    if (this.isEditModal) {
      await this.cacheQuizItem(this.editItem)

      const { type, item, direction } = this.editItem
      const { cards = [] } =
        this.quizData.filter((d) => {
          return d.type === type && d.item === item
        })[0] || {}

      const { front, back, mnemonic } =
        cards.filter((c) => {
          return c.direction === direction
        })[0] || {}

      this.editItem.front = front || cardDefault[type][direction].front || ''
      this.editItem.back = back || cardDefault[type][direction].back || ''
      this.editItem.mnemonic = mnemonic || ''

      // this.$set(this, 'editItem', this.editItem)
      this.$forceUpdate()
    }
  }

  onEditTabChange(i: number) {
    this.$nextTick(() => {
      ;(this.$refs[`mde${i}`] as any).codemirror.refresh()
    })
  }

  async getDueIn() {
    if (this.dueItems.length > 0) {
      this.dueIn = null
      return
    }

    const it = (await this.load({ _dueIn: true }))[0]
    this.dueIn = it ? it.nextReview : null
  }
}
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}

.column-label {
  width: 5rem;
}

.taginput-field {
  padding-top: 1em;
  display: flex;
  flex-direction: row-reverse;
}

.quiz-modal .card-content {
  min-height: 100px;
  max-height: calc(100vh - 100px - 100px);
  overflow: scroll;
}

.buttons-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.edit-modal .card-footer {
  padding: 1rem;
}
</style>

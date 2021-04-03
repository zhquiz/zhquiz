<template>
  <section>
    <div v-if="isInit" class="QuizPage">
      <div class="columns" style="flex-wrap: wrap">
        <div class="column is-4-fullhd is-5">
          <div class="field">
            <label class="label">Type</label>
            <b-field class="flex-wrap">
              <b-checkbox-button
                v-model="type"
                native-value="character"
                type="is-success"
              >
                Hanzi
              </b-checkbox-button>
              <b-checkbox-button
                v-model="type"
                native-value="vocabulary"
                type="is-success"
              >
                Vocab
              </b-checkbox-button>
              <b-checkbox-button
                v-model="type"
                native-value="sentence"
                type="is-success"
              >
                Sentence
              </b-checkbox-button>
            </b-field>
          </div>
        </div>
        <div class="column is-4-fullhd is-7">
          <div class="field">
            <label class="label">Learning stage</label>
            <b-field class="flex-wrap">
              <b-checkbox-button
                v-model="stage"
                native-value="new"
                type="is-success"
              >
                New
              </b-checkbox-button>
              <b-checkbox-button
                v-model="stage"
                native-value="learning"
                type="is-success"
              >
                Learning
              </b-checkbox-button>
              <b-checkbox-button
                v-model="stage"
                native-value="graduated"
                type="is-success"
              >
                Graduated
              </b-checkbox-button>
            </b-field>
          </div>
        </div>
        <div class="column is-4-fullhd is-5" style="min-width: 350px">
          <div class="field">
            <label class="label">Options</label>
            <div class="control">
              <b-checkbox v-model="includeUndue">Include undue</b-checkbox>
              <b-checkbox
                :value="includeLeech"
                @click.native.prevent="
                  if (includeLeech) {
                    includeLeech = undefined
                  } else if (includeLeech === undefined) {
                    includeLeech = false
                  } else {
                    includeLeech = true
                  }
                "
                title="wrongStreak>2"
                :indeterminate="includeLeech === undefined"
              >
                Include leech
              </b-checkbox>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">Direction</label>
            <b-field class="flex-wrap more-wrap">
              <b-checkbox-button
                v-model="direction"
                native-value="se"
                type="is-success"
              >
                Simplified-English
              </b-checkbox-button>
              <b-checkbox-button
                v-model="direction"
                native-value="te"
                type="is-success"
              >
                Traditional-English
              </b-checkbox-button>
              <b-checkbox-button
                v-model="direction"
                native-value="ec"
                type="is-success"
              >
                English-Chinese
              </b-checkbox-button>
            </b-field>
          </div>
        </div>
        <div class="column" style="min-width: min(100vw, 600px)">
          <form @submit.prevent="reload">
            <b-field label="Filter" grouped>
              <b-input
                v-model="q"
                placeholder="Try hLevel>10, vLevel<=20 or tag:HSK4"
                type="search"
                expanded
              />
              <p class="control" title="Save settings">
                <b-button type="is-primary is-outlined" @click="doSave">
                  <b-icon icon="save"></b-icon>
                </b-button>
              </p>
            </b-field>
          </form>
        </div>
      </div>

      <b-collapse class="card" animation="slide" :open="isQuizDashboardReady">
        <div
          slot="trigger"
          slot-scope="props"
          class="card-header"
          role="button"
        >
          <p class="card-header-title">Quiz</p>
          <a role="button" class="card-header-icon">
            <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
          </a>
        </div>
        <div class="card-content">
          <div class="columns">
            <div class="column is-3">
              <div v-if="includeUndue">
                <span class="column-label">Pending: </span>
                <span>{{ quizArray.length | format }}</span>
              </div>
              <div v-else-if="dueItems.length">
                <span class="column-label">Due: </span>
                <span>{{ dueItems.length | format }}</span>
              </div>
              <div v-else-if="dueIn">
                <span class="column-label">Due in: </span>
                <span>{{ dueIn | duration }}</span>
              </div>
              <div v-else>
                <span>No items due</span>
              </div>
            </div>

            <div class="column is-3">
              <span class="column-label">New: </span>
              <span>{{ newItems.length | format }}</span>
            </div>
            <div class="column is-3">
              <span class="column-label">Leech: </span>
              <span>{{ leechCount | format }}</span>
            </div>
            <div class="column is-3 flex flex-row">
              <div class="flex-grow" />
              <b-button
                type="is-success"
                :disabled="quizArray.length === 0"
                @click="startQuiz"
              >
                Start Quiz
              </b-button>
            </div>
          </div>
        </div>
      </b-collapse>

      <QuizCard ref="quizCard" :quiz-array="quizArray" @quiz:ended="reload" />

      <div class="card" v-if="presets.count">
        <div class="card-header">
          <div class="card-header-title">Presets</div>
        </div>
        <div class="card-content">
          <form class="mb-4" @submit.prevent="presets.q = presets.q0">
            <b-field label="Filter" grouped>
              <b-input v-model="presets.q" type="search" expanded />
            </b-field>
          </form>

          <b-field
            v-for="r in presets.result"
            :key="r.id"
            grouped
            style="width: 100%"
          >
            <b-button type="is-link is-light" expanded @click="setPreset(r.id)">
              {{ r.name }}
            </b-button>
            <p class="control ml-2">
              <b-button
                type="is-danger is-outlined"
                @click="deletePreset(r.id)"
              >
                <b-icon icon="trash"></b-icon>
              </b-button>
            </p>
          </b-field>

          <b-pagination
            class="mt-4"
            v-if="presets.count > presets.limit"
            v-model="presets.page"
            :total="presets.count"
            :per-page="presets.limit"
            icon-prev="angle-left"
            icon-next="angle-right"
            @change="(p) => (presets.page = p)"
          />
        </div>
      </div>

      <b-loading :active="isLoading" />
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'

import QuizCard, { IQuizData, IQuizType } from '@/components/cards/QuizCard.vue'

@Component<QuizTab>({
  components: {
    QuizCard,
  },
  async created() {
    this.$emit('title', 'Quiz')

    const { data: r } = await this.$axios.userGetSettings({
      select: 'quizSettings',
    })

    const { type, stage, direction, includeLeech, includeUndue, q } =
      r.quizSettings || {}

    if (type) {
      this.type = type as any[]
    }

    if (stage) {
      this.stage = stage
    }

    if (direction) {
      this.direction = direction
    }

    if (typeof includeLeech === 'boolean') {
      this.includeLeech = includeLeech
    }

    if (typeof includeUndue === 'boolean') {
      this.includeUndue = includeUndue
    }

    this.q = q || ''

    await this.init()
    this.isQuizDashboardReady = true

    await this.loadPresets()
  },
})
export default class QuizTab extends Vue {
  @Ref() quizCard!: QuizCard

  isLoading = false
  isInit = false
  isQuizDashboardReady = false

  q = ''

  presets = {
    q: '',
    q0: '',
    result: [] as {
      id: string
      name: string
    }[],
    count: 0,
    page: 1,
    limit: 5,
  }

  type: IQuizType[] = ['character', 'vocabulary']
  stage = ['new', 'leech', 'learning']
  direction = ['se']

  includeUndue = false
  includeLeech = true

  leechCount = 0
  dueIn: Date | null = null

  quizArray: string[] = []

  quizData: {
    [quizId: string]: IQuizData
  } = {}

  cache: {
    now: number
  } = {
    now: +new Date(),
  }

  get backlogItems() {
    this.cache.now = +new Date()
    return this.quizArray.filter((id) => {
      const d = this.quizData[id]
      return d && d.nextReview && +new Date(d.nextReview) < this.cache.now
    })
  }

  get dueItems() {
    return [...this.backlogItems, ...this.newItems]
  }

  get newItems() {
    return this.quizArray.filter((id) => {
      const d = this.quizData[id]
      return d && typeof d.nextReview !== 'string'
    })
  }

  async init() {
    const { data: r } = await this.$axios.userGetSettings({
      select: 'quizSettings',
    })

    const { type, stage, direction, includeLeech, includeUndue, q } =
      r.quizSettings || {}

    if (type) {
      this.type = type as any[]
    }

    if (stage) {
      this.stage = stage
    }

    if (direction) {
      this.direction = direction
    }

    if (typeof includeLeech === 'boolean') {
      this.includeLeech = includeLeech
    }

    if (typeof includeUndue !== 'undefined') {
      this.includeUndue = includeUndue
    }

    this.q = q || ''

    this.isInit = true
    this.isLoading = false

    await this.reload()
  }

  @Watch('type', { deep: true })
  @Watch('stage', { deep: true })
  @Watch('direction', { deep: true })
  @Watch('includeUndue')
  @Watch('includeLeech')
  async reload() {
    const { quiz, upcoming, stats } = await this.$axios
      .quizInit(null, {
        type: this.type,
        stage: this.stage,
        direction: this.direction,
        includeUndue: this.includeUndue,
        includeLeech: this.includeLeech,
        q: this.q,
      })
      .then((r) => r.data)

    const quizArray: string[] = []
    quiz.map((it: any) => {
      quizArray.push(it.id)
      this.quizData[it.id] = it
    })

    this.quizArray = quizArray
    this.$set(this, 'quizData', this.quizData)

    this.dueIn =
      upcoming[0] && upcoming[0].nextReview
        ? new Date(upcoming[0].nextReview)
        : null
    this.leechCount = stats.leech
  }

  async startQuiz() {
    await this.quizCard.startQuiz()
  }

  doSave() {
    this.$buefy.dialog.prompt({
      message: "Settings' name",
      trapFocus: true,
      onConfirm: async (name) => {
        await this.$axios.presetCreate(null, {
          name,
          settings: {
            type: this.type,
            stage: this.stage,
            direction: this.direction,
            includeUndue: this.includeUndue,
            includeLeech: this.includeLeech,
            q: this.q,
          },
        })
        await this.loadPresets()
      },
    })
  }

  async loadPresets() {
    const {
      data: { result, count },
    } = await this.$axios.presetQuery({
      q: this.presets.q,
      page: this.presets.page,
      limit: this.presets.limit,
    })

    this.presets.result = result
    this.presets.count = count
  }

  async setPreset(id: string) {
    const { data: settings } = await this.$axios.presetGetOne({ id })

    this.type = settings.type as any[]
    this.stage = settings.stage
    this.direction = settings.direction
    this.includeUndue = settings.includeUndue
    this.q = settings.q || ''
  }

  deletePreset(id: string) {
    this.$buefy.dialog.confirm({
      message: 'Are you sure you want to delete this settings?',
      onConfirm: async () => {
        await this.$axios.presetDelete({ id })
        await this.loadPresets()
      },
    })
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

.quiz-modal .modal-content {
  max-width: 500px !important;
}

.quiz-modal .buttons-area {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.buttons-area .buttons {
  margin-bottom: 0;
}

.quiz-modal .card-content {
  min-height: 7.5rem;
  max-height: calc(100vh - 300px);
  overflow: scroll;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  border-bottom: 1px solid hsla(0, 0%, 50%, 0.25);
}

.buttons-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons-panel .buttons {
  margin-bottom: 0;
}

.buttons-area button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background-color: currentColor;
  visibility: hidden;
  z-index: 2;
}

.buttons-area button:not(:active)::before {
  animation: ripple 0.4s cubic-bezier(0, 0, 0.2, 1);
  transition: visibility 0.4s step-end;
}

.buttons-area button:active::before {
  visibility: visible;
}

.edit-modal .card-footer {
  padding: 1rem;
}

.hover-blue:hover {
  color: blue;
}

.cursor-pointer {
  cursor: pointer;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 150px;
    height: 150px;
    opacity: 0;
  }
}

.more-wrap ::v-deep .field {
  flex-wrap: wrap;
}
</style>

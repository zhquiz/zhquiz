<template>
  <section>
    <div class="VocabPage">
      <form class="field" @submit.prevent="q = q0">
        <div class="control">
          <input
            v-model="q0"
            type="search"
            class="input"
            name="q"
            placeholder="Type here to search."
            aria-label="search"
          />
        </div>
      </form>

      <div class="columns">
        <div class="column is-6 entry-display">
          <div
            :class="
              simplified.length > 3 ? 'smaller-vocab-display' : 'vocab-display'
            "
          >
            <div
              class="clickable text-center font-zh-simp"
              @contextmenu.prevent="
                (evt) => openContext(evt, simplified, 'vocab')
              "
            >
              {{ simplified }}
            </div>
          </div>

          <div class="buttons has-addons">
            <button
              class="button"
              :disabled="i < 1"
              @click="i--"
              @keypress="i--"
            >
              Previous
            </button>
            <button
              class="button"
              :disabled="i > entries.length - 2"
              @click="i++"
              @keypress="i++"
            >
              Next
            </button>
          </div>
        </div>

        <div class="column is-6">
          <b-collapse
            class="card"
            animation="slide"
            style="margin-bottom: 1em"
            :open="typeof current === 'object'"
          >
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Reading</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span>{{ current.pinyin }}</span>
            </div>
          </b-collapse>

          <b-collapse
            class="card"
            animation="slide"
            :open="!!current.traditional"
          >
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Traditional</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <div
                class="font-zh-trad clickable"
                @contextmenu.prevent="
                  (evt) => openContext(evt, current.traditional, 'vocab')
                "
              >
                {{ current.traditional }}
              </div>
            </div>
          </b-collapse>

          <b-collapse class="card" animation="slide" :open="!!current.english">
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">English</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span>{{ current.english }}</span>
            </div>
          </b-collapse>

          <b-collapse
            :key="sentenceKey"
            class="card"
            animation="slide"
            :open="!!sentences().length"
          >
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Sentences</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <div
                v-for="(s, i) in sentences()"
                :key="i"
                class="sentence-entry"
              >
                <span
                  class="clickable"
                  @contextmenu.prevent="
                    (evt) => openContext(evt, s.chinese, 'sentence')
                  "
                >
                  {{ s.chinese }}
                </span>
                <span>{{ s.english }}</span>
              </div>
            </div>
          </b-collapse>
        </div>
      </div>
    </div>

    <ContextMenu
      ref="context"
      :entry="selected.entry"
      :type="selected.type"
      :additional="additionalContext"
      :pinyin="sentenceDef.pinyin"
      :english="sentenceDef.english"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import toPinyin from 'chinese-to-pinyin'
import ContextMenu from '@/components/ContextMenu.vue'
import { findSentence, zhSentence } from '@/assets/db'

@Component<VocabPage>({
  components: {
    ContextMenu,
  },
  watch: {
    q() {
      this.onQChange(this.q)
    },
    current() {
      this.loadContent()
    },
  },
  head() {
    return {
      title: this.title,
      titleTemplate: '%s - ZhQuiz',
    }
  },
  layout: 'app',
})
export default class VocabPage extends Vue {
  @Ref() context!: ContextMenu

  entries: {
    entry: string
    alt: string[]
    reading: string[]
    english: string[]
  }[] = []

  i = 0

  selected: {
    entry: string
    type: string
  } = {
    entry: '',
    type: '',
  }

  q0 = ''
  title = 'Vocabulary'

  sentenceKey = 0

  sentences() {
    return zhSentence
      .find({
        chinese: {
          $containsString: this.simplified,
        },
      })
      .slice(0, 10)
  }

  get sentenceDef() {
    if (this.selected.type !== 'sentence') {
      return {}
    }

    const it = zhSentence.findOne({ chinese: this.selected.entry })
    if (!it) {
      return {}
    }

    return {
      pinyin: {
        [this.selected.entry]: it.pinyin,
      },
      english: {
        [this.selected.entry]: it.english,
      },
    }
  }

  get q() {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q(q: string) {
    this.$router.push({ query: { q } })
  }

  get simplified() {
    const r = this.entries[this.i]
    return r?.entry || ''
  }

  async created() {
    let entry = this.$route.query.entry as string

    if (!(entry || this.q)) {
      const {
        data: { result },
      } = await this.$axios.vocabularyRandom()

      entry = result
    }

    this.q0 = entry || this.q

    if (entry) {
      this.title = (entry ? entry + ' - ' : '') + 'Vocab'

      this.entries = [
        {
          entry,
          alt: [],
          reading: [],
          english: [],
        },
      ]
      await this.loadContent()
    } else {
      await this.onQChange(this.q0)
    }
  }

  get additionalContext() {
    if (!this.q) {
      return [
        {
          name: 'Reload',
          handler: async () => {
            const {
              data: { result },
            } = await this.$axios.vocabularyRandom()

            this.q0 = result
          },
        },
      ]
    }

    return []
  }

  openContext(
    evt: MouseEvent,
    entry = this.selected.entry,
    type = this.selected.type
  ) {
    this.selected = { entry, type }
    this.context.open(evt)
  }

  async onQChange(q: string) {
    this.title = (q ? q + ' - ' : '') + 'Vocab'

    if (/\p{sc=Han}+/u.test(q)) {
      let qs = await this.$axios.tokenize({ q }).then((r) => r.data.result)

      qs = qs
        .filter((h) => /\p{sc=Han}+/u.test(h))
        .filter((h, i, arr) => arr.indexOf(h) === i)

      this.entries = qs.map((entry) => ({
        entry,
        alt: [],
        reading: [],
        english: [],
      }))
    } else {
      this.entries = [
        {
          entry: q,
          alt: [],
          reading: [],
          english: [],
        },
      ]
    }

    await this.loadContent()

    this.i = 0
  }

  async loadContent() {
    let entry = this.entries[this.i]
    if (!entry) {
      return
    }

    if (!entry.reading.length) {
      if (/\p{sc=Han}/u.test(entry.entry)) {
        const { data } = await this.$axios
          .vocabularyGetByEntry({ entry: entry.entry })
          .catch(() => ({ data: null }))

        if (data) {
          this.entries = [
            ...this.entries.slice(0, this.i),
            data,
            ...this.entries.slice(this.i + 1),
          ]
        } else {
          this.entries = [
            ...this.entries.slice(0, this.i),
            {
              ...entry,
              reading: [
                toPinyin(entry.entry, { keepRest: true, toneToNumber: true }),
              ],
            },
            ...this.entries.slice(this.i + 1),
          ]
        }
      } else {
        const {
          data: { result },
        } = await this.$axios.vocabularyQuery({ q: entry.entry })

        this.entries = [
          ...this.entries.slice(0, this.i),
          ...result.map((entry) => ({
            entry,
            alt: [],
            reading: [],
            english: [],
          })),
          ...this.entries.slice(this.i + 1),
        ]
      }
    }

    if (!/\p{sc=Han}/u.test(entry.entry)) {
      return
    }

    if (await findSentence(entry.entry, 10)) {
      this.sentenceKey = Math.random()
    }
  }
}
</script>

<style scoped>
.entry-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.entry-display .clickable {
  min-height: 1.5em;
  display: block;
}

.card {
  margin-bottom: 1rem;
}

.card [class^='font-'] {
  font-size: 60px;
  height: 80px;
}

.card-content {
  max-height: 250px;
  overflow: scroll;
}

.sentence-entry {
  margin-right: 1rem;
}
</style>

<template>
  <section>
    <div class="VocabPage">
      <form class="field" @submit.prevent="$set(query, 'q', q0)">
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
              @click="(evt) => openContext(evt, simplified, 'vocabulary')"
              @contextmenu.prevent="
                (evt) => openContext(evt, simplified, 'vocabulary')
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

          <div v-if="current.tag && current.tag.length" class="mb-4">
            Tags:
            <b-taglist style="display: inline-flex">
              <b-tag
                v-for="t in current.tag.slice(0, 5)"
                :key="t"
                type="is-info"
              >
                {{ t }}
              </b-tag>
            </b-taglist>
          </div>
        </div>

        <div class="column is-6">
          <b-collapse
            class="card"
            animation="slide"
            style="margin-bottom: 1em"
            :open="!!current.reading.length"
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
              <span>{{ current.reading.join(' / ') }}</span>
            </div>
          </b-collapse>

          <b-collapse
            class="card"
            animation="slide"
            :open="!!(current.alt && current.alt.length)"
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
              <span
                v-for="a in current.alt || []"
                :key="a"
                class="font-zh-trad clickable space-separated"
                @click="(evt) => openContext(evt, a, 'vocabulary')"
                @contextmenu.prevent="
                  (evt) => openContext(evt, a, 'vocabulary')
                "
              >
                {{ a }}
              </span>
            </div>
          </b-collapse>

          <b-collapse
            class="card"
            animation="slide"
            :open="!!(current.english || []).length"
          >
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
              <span>{{ (current.english || []).join(' / ') }}</span>
            </div>
          </b-collapse>

          <b-collapse
            class="card"
            animation="slide"
            :open="!!current.sentences.length"
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
                v-for="(s, i) in current.sentences"
                :key="i"
                class="sentence-entry"
              >
                <span
                  class="clickable"
                  @click="(evt) => openContext(evt, s.entry, 'sentence')"
                  @contextmenu.prevent="
                    (evt) => openContext(evt, s.entry, 'sentence')
                  "
                >
                  {{ s.entry }}
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
    />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'nuxt-property-decorator'
import toPinyin from 'chinese-to-pinyin'
import ContextMenu from '@/components/ContextMenu.vue'

@Component<VocabularyTab>({
  components: {
    ContextMenu,
  },
  watch: {
    'query.q'() {
      this.onQChange(this.query.q || '')
    },
    current() {
      this.loadContent()
    },
  },
})
export default class VocabularyTab extends Vue {
  @Prop({ default: () => ({}) }) query!: {
    q?: string
  }

  @Ref() context!: ContextMenu

  entries: {
    id: string
    entry: string
    alt: string[]
    reading: string[]
    english: string[]
    tag: string[]
    sentences: {
      entry: string
      english: string
    }[]
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

  get current() {
    return (
      this.entries[this.i] || {
        entry: '',
        alt: [],
        reading: [],
        english: [],
        sentences: [],
      }
    )
  }

  get simplified() {
    const { entry = '' } = this.current

    if (/\p{sc=Han}/u.test(entry)) {
      return entry
    }

    return ''
  }

  async created() {
    this.$emit('title', 'Vocabulary')

    let entry = this.$route.query.entry as string

    if (!(entry || this.query.q)) {
      const {
        data: { result },
      } = await this.$axios.vocabularyRandom()

      entry = result
    }

    this.q0 = entry || this.query.q || ''

    if (entry) {
      this.$emit('title', (entry ? entry + ' - ' : '') + 'Vocabulary')

      this.entries = [
        {
          id: entry,
          entry,
          alt: [],
          reading: [],
          english: [],
          sentences: [],
          tag: [],
        },
      ]
    } else {
      await this.onQChange(this.q0)
    }
  }

  get additionalContext() {
    if (!this.query.q) {
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
    this.$emit('title', (q ? q + ' - ' : '') + 'Vocabulary')

    if (/\p{sc=Han}+/u.test(q)) {
      let qs = await this.$axios.tokenize({ q }).then((r) => r.data.result)

      qs = qs
        .filter((h) => /\p{sc=Han}+/u.test(h))
        .filter((h, i, arr) => arr.indexOf(h) === i)

      this.entries = qs.map((entry) => ({
        id: entry,
        entry,
        alt: [],
        reading: [],
        english: [],
        sentences: [],
        tag: [],
      }))
    } else {
      if (!q.trim()) {
        const {
          data: { result },
        } = await this.$axios.vocabularyRandom()

        this.q0 = result
        this.$set(this.query, 'q', result)
        return
      }

      this.entries = [
        {
          id: q,
          entry: q,
          alt: [],
          reading: [],
          english: [],
          sentences: [],
          tag: [],
        },
      ]
    }

    this.i = 0
  }

  async loadContent() {
    let entry = this.entries[this.i]
    if (!entry) {
      return
    }

    const { id } = entry

    if (!entry.reading.length) {
      if (/\p{sc=Han}/u.test(entry.entry)) {
        const { data } = await this.$axios
          .vocabularyGetByEntry({ entry: entry.entry }, null, {
            validateStatus: (n) => (n >= 200 && n < 300) || n === 404,
          })
          .catch(() => ({ data: null }))

        const i = this.entries.findIndex((it) => it.id === id) || this.i
        if (data) {
          this.entries = [
            ...this.entries.slice(0, i),
            {
              ...data,
              id,
              entry: data.entry || '',
              reading: data.reading || [],
              sentences: [],
            },
            ...this.entries.slice(i + 1),
          ]
        } else {
          this.entries = [
            ...this.entries.slice(0, i),
            {
              ...entry,
              reading: [
                toPinyin(entry.entry, { keepRest: true, toneToNumber: true }),
              ],
            },
            ...this.entries.slice(i + 1),
          ]
        }
      } else {
        const {
          data: { result },
        } = await this.$axios.vocabularyQuery({ q: entry.entry })

        const i = this.entries.findIndex((it) => it.id === id) || this.i
        this.entries = [
          ...this.entries.slice(0, i),
          ...result.map((entry) => ({
            id: entry,
            entry,
            alt: [],
            reading: [],
            english: [],
            sentences: [],
            tag: [],
          })),
          ...this.entries.slice(i + 1),
        ]
      }
    } else if (!entry.sentences.length) {
      const {
        data: { result },
      } = await this.$axios.vocabularySentence({
        entry: entry.entry,
      })

      entry.sentences = result
    }
  }
}
</script>

<style lang="scss" scoped>
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

span.space-separated {
  & + & {
    margin-left: 0.5em;
  }
}
</style>

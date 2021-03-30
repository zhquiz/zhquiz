<template>
  <section>
    <div class="HanziPage">
      <form class="field" @submit.prevent="$set(query, 'q', q0)">
        <div class="control">
          <input
            v-model="q0"
            class="input"
            type="search"
            name="q"
            placeholder="Type here to search."
            aria-label="search"
          />
        </div>
      </form>

      <div class="columns">
        <div class="column is-6 entry-display">
          <div
            class="hanzi-display clickable font-han"
            @click="(evt) => openContext(evt, current, 'character')"
          >
            {{ current }}
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
          <b-collapse class="card" animation="slide" :open="!!sub.length">
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Subcompositions</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span
                v-for="h in sub"
                :key="h"
                class="font-han clickable"
                @click="(evt) => openContext(evt, h, 'character')"
              >
                {{ h }}
              </span>
            </div>
          </b-collapse>

          <b-collapse class="card" animation="slide" :open="!!sup.length">
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Supercompositions</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span
                v-for="h in sup"
                :key="h"
                class="font-han clickable"
                @click="(evt) => openContext(evt, h, 'hanzi')"
              >
                {{ h }}
              </span>
            </div>
          </b-collapse>

          <b-collapse class="card" animation="slide" :open="!!variants.length">
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Variants</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span
                v-for="h in variants"
                :key="h"
                class="font-han clickable"
                @click="(evt) => openContext(evt, h, 'character')"
              >
                {{ h }}
              </span>
            </div>
          </b-collapse>

          <b-collapse class="card" animation="slide" :open="!!vocabs.length">
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Vocabularies</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <div v-for="(v, i) in vocabs" :key="i" class="long-item">
                <span
                  class="clickable"
                  @click="(evt) => openContext(evt, v.entry, 'vocabulary')"
                >
                  {{ v.entry }}
                </span>

                <span v-if="v.alt" class="clickable">
                  {{ v.alt.join(' ') }}
                </span>

                <span class="pinyin">[{{ v.reading.join(' / ') }}]</span>

                <span>{{ v.english.join(' / ') }}</span>
              </div>
            </div>
          </b-collapse>

          <b-collapse class="card" animation="slide" :open="!!sentences.length">
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
              <div v-for="(s, i) in sentences" :key="i" class="long-item">
                <span
                  class="clickable"
                  @click="(evt) => openContext(evt, s.entry, 'sentence')"
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
import { Component, Prop, Ref, Vue, Watch } from 'nuxt-property-decorator'
import ContextMenu from '@/components/ContextMenu.vue'

@Component<CharacterTab>({
  async created() {
    this.$emit('title', 'Hanzi')

    this.q0 = this.query.q || ''

    if (this.additionalContext[0]) {
      await this.additionalContext[0].handler()
    }

    this.onQChange(this.q0)
  },
})
export default class CharacterTab extends Vue {
  @Prop({ default: () => ({}) }) query!: {
    q?: string
  }

  @Ref() context!: ContextMenu

  entries: string[] = []
  i = 0

  sub: string[] = []
  sup: string[] = []
  variants: string[] = []
  vocabs: {
    entry: string
    alt: string[]
    reading: string[]
    english: string[]
  }[] = []
  sentences: {
    entry: string
    english: string
  }[] = []

  selected: {
    entry: string
    type: string
  } = {
    entry: '',
    type: '',
  }

  q0 = ''

  get current() {
    return this.entries[this.i] || ' '
  }

  get additionalContext() {
    if (!(this.query.q || '').trim()) {
      return [
        {
          name: 'Reload',
          handler: async () => {
            const {
              data: { result },
            } = await this.$axios.characterRandom()

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

  @Watch('query.q')
  async onQChange(q: string) {
    this.$emit('title', (q ? q + ' - ' : '') + 'Hanzi')

    if (/\p{sc=Han}/u.test(q)) {
      const qs = q.split('').filter((h) => /\p{sc=Han}/u.test(h))
      this.entries = qs.filter((h, i) => qs.indexOf(h) === i)
    } else {
      if (!q.trim()) {
        const {
          data: { result },
        } = await this.$axios.characterRandom()

        this.q0 = result
        this.$set(this.query, 'q', result)
        return
      }

      const r = await this.$axios.characterQuery({ q })
      this.entries = r.data.result
    }

    this.i = 0
  }

  @Watch('current')
  load() {
    if (this.current) {
      this.loadHanzi()
      this.loadVocab()
      this.loadSentences()
    } else {
      this.sub = []
      this.sup = []
      this.variants = []
      this.vocabs = []
      this.sentences = []
    }
  }

  async loadHanzi() {
    if (!/^\p{sc=Han}$/u.test(this.current)) {
      this.sub = []
      this.sup = []
      this.variants = []
      return
    }

    const { data: r } = await this.$axios.characterRadical({
      entry: this.current,
    })

    this.sub = r.sub
    this.sup = r.sup
    this.variants = r.var
  }

  async loadVocab() {
    if (!/^\p{sc=Han}$/u.test(this.current)) {
      this.vocabs = []
      return
    }

    const {
      data: { result },
    } = await this.$axios.characterVocabulary({
      entry: this.current,
    })

    this.vocabs = result
  }

  async loadSentences() {
    if (!/^\p{sc=Han}$/u.test(this.current)) {
      this.sentences = []
      return
    }

    const {
      data: { result },
    } = await this.$axios.characterSentence({
      entry: this.current,
    })

    this.sentences = result
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

.card-content {
  max-height: 250px;
  overflow: scroll;
}

.card-content .font-han {
  font-size: 50px;
  display: inline-block;
}

.long-item > span + span {
  margin-left: 1rem;
}

.long-item > .pinyin {
  min-width: 8rem;
}
</style>

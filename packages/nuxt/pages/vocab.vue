<template>
  <section class="VocabPage container">
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
        <div class="font-hanzi">
          <div
            class="clickable text-center"
            @contextmenu.prevent="
              (evt) => {
                selectedVocab = simplified
                $refs.vocabContextmenu.open(evt)
              }
            "
          >
            {{ simplified }}
          </div>
          <b-loading :active="isQLoading" :is-full-page="false" />
        </div>

        <div class="buttons has-addons">
          <button class="button" :disabled="i < 1" @click="i--" @keypress="i--">
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

          <b-dropdown hoverable aria-role="list">
            <button slot="trigger" class="button">
              <fontawesome icon="caret-down" />
            </button>

            <b-dropdown-item aria-role="listitem">
              Search in MDBG
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </div>

      <div class="column is-6">
        <b-collapse
          class="card"
          animation="slide"
          style="margin-bottom: 1em;"
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
              class="font-hanzi clickable"
              @contextmenu.prevent="
                (evt) => {
                  selectedVocab = current.traditional
                  $refs.vocabContextmenu.open(evt)
                }
              "
            >
              {{ current.traditional }}
            </div>
          </div>
        </b-collapse>

        <b-collapse
          class="card"
          animation="slide"
          :open="typeof current === 'object'"
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
            <span>{{ current.english }}</span>
          </div>
        </b-collapse>

        <b-collapse class="card" animation="slide" :open="sentences.length > 0">
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
            <div v-for="(s, i) in sentences" :key="i" class="sentence-item">
              <span
                class="clickable"
                @contextmenu.prevent="
                  (evt) => {
                    selectedSentence = s.chinese
                    $refs.sentenceContextmenu.open(evt)
                  }
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

    <client-only>
      <vue-context ref="vocabContextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="speak(selectedVocab)"
            @keypress.prevent="speak(selectedVocab)"
          >
            Speak
          </a>
        </li>
        <li v-if="!vocabIds[selectedVocab] || !vocabIds[selectedVocab].length">
          <a
            role="button"
            @click.prevent="addToQuiz(selectedVocab, 'vocab')"
            @keypress="addToQuiz(selectedVocab, 'vocab')"
          >
            Add to quiz
          </a>
        </li>
        <li v-else>
          <a
            role="button"
            @click.prevent="removeFromQuiz(selectedVocab, 'vocab')"
            @keypress="removeFromQuiz(selectedVocab, 'vocab')"
          >
            Remove from quiz
          </a>
        </li>
        <li>
          <router-link
            :to="{ path: '/vocab', query: { q: selectedVocab } }"
            target="_blank"
          >
            Search for vocab
          </router-link>
        </li>
        <li>
          <router-link
            :to="{ path: '/hanzi', query: { q: selectedVocab } }"
            target="_blank"
          >
            Search for Hanzi
          </router-link>
        </li>
        <li>
          <a
            :href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${selectedVocab}*`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in MDBG
          </a>
        </li>
      </vue-context>

      <vue-context ref="sentenceContextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="speak(selectedSentence)"
            @keypress.prevent="speak(selectedSentence)"
          >
            Speak
          </a>
        </li>
        <li
          v-if="
            !sentenceIds[selectedSentence] ||
            !sentenceIds[selectedSentence].length
          "
        >
          <a
            role="button"
            @click.prevent="addToQuiz(selectedSentence, 'sentence')"
            @keypress.prevent="addToQuiz(selectedSentence, 'sentence')"
          >
            Add to quiz
          </a>
        </li>
        <li v-else>
          <a
            role="button"
            @click.prevent="removeFromQuiz(selectedSentence, 'sentence')"
            @keypress.prevent="removeFromQuiz(selectedSentence, 'sentence')"
          >
            Remove from quiz
          </a>
        </li>
        <li>
          <router-link
            :to="{ path: '/vocab', query: { q: selectedSentence } }"
            target="_blank"
          >
            Search for vocab
          </router-link>
        </li>
        <li>
          <router-link
            :to="{ path: '/hanzi', query: { q: selectedSentence } }"
            target="_blank"
          >
            Search for Hanzi
          </router-link>
        </li>
        <li>
          <a
            :href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${selectedSentence}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in MDBG
          </a>
        </li>
      </vue-context>
    </client-only>
  </section>
</template>

<script lang="ts">
import XRegExp from 'xregexp'
import { Component, Vue, Watch } from 'nuxt-property-decorator'

import { speak } from '~/assets/speak'

@Component({
  layout: 'app',
})
export default class VocabPage extends Vue {
  entries: string[] = []
  i: number = 0
  isQLoading = false

  sentences: any[] = []

  selectedVocab = ''
  selectedSentence = ''

  vocabIds: any = {}
  sentenceIds: any = {}

  speak = speak

  q0 = ''

  get q() {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q(q: string) {
    this.$router.push({ query: { q } })
  }

  get current() {
    return this.entries[this.i] || ('' as any)
  }

  get simplified() {
    return typeof this.current === 'string'
      ? this.current
      : this.current.simplified
  }

  created() {
    this.q0 = this.q
    this.onQChange(this.q0)
  }

  @Watch('q')
  async onQChange(q: string) {
    if (q) {
      this.isQLoading = true

      let qs = (await this.$axios.$post('/api/lib/jieba', { entry: q }))
        .result as string[]
      qs = qs.filter((h) => XRegExp('\\p{Han}+').test(h))
      this.$set(
        this,
        'entries',
        qs.filter((h, i) => qs.indexOf(h) === i)
      )
      this.loadContent()
    }

    this.i = 0
    this.isQLoading = false
  }

  @Watch('current')
  async loadContent() {
    if (typeof this.current === 'string') {
      const { vocab, sentences } = (
        await this.$axios.$post('/api/vocab/match', { entry: this.current })
      ).result

      if (vocab.length > 0) {
        this.entries = [
          ...this.entries.slice(0, this.i),
          ...vocab,
          ...this.entries.slice(this.i + 1),
        ]
      }

      this.$set(this, 'sentences', sentences)
    }
  }

  @Watch('selectedVocab')
  async loadVocabStatus() {
    if (this.selectedVocab) {
      const { result } = await this.$axios.$post('/api/card/q', {
        cond: { item: this.selectedVocab, type: 'vocab' },
        hasCount: false,
        projection: {
          _id: 1,
        },
      })
      this.$set(
        this.vocabIds,
        this.selectedVocab,
        result.map((d: any) => d._id)
      )
    }
  }

  @Watch('selectedSentence')
  async loadSentenceStatus() {
    if (this.selectedSentence) {
      const { result } = await this.$axios.$post('/api/card/q', {
        cond: { item: this.selectedSentence, type: 'sentence' },
        hasCount: false,
        projection: {
          _id: 1,
        },
      })
      this.$set(
        this.sentenceIds,
        this.selectedSentence,
        result.map((d: any) => d._id)
      )
    }
  }

  async addToQuiz(item: string, type: string) {
    await this.$axios.$put('/api/card/', { item, type })
    this.$buefy.snackbar.open(`Added ${type}: ${item} to quiz`)

    type === 'vocab' ? this.loadVocabStatus() : this.loadSentenceStatus()
  }

  async removeFromQuiz(item: string, type: string) {
    const ids =
      (type === 'vocab' ? this.vocabIds[item] : this.sentenceIds[item]) || []
    await Promise.all(
      ids.map((id: string) =>
        this.$axios.$delete('/api/card/', {
          data: { id },
        })
      )
    )

    this.$buefy.snackbar.open(`Removed ${type}: ${item} from quiz`)

    type === 'vocab' ? this.loadVocabStatus() : this.loadSentenceStatus()
  }
}
</script>

<style scoped>
.entry-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.entry-display .font-hanzi {
  font-size: 120px;
  min-height: 200px;
  position: relative;
}

.card {
  margin-bottom: 1rem;
}

.card .font-hanzi {
  font-size: 60px;
  height: 80px;
}

.card-content {
  max-height: 250px;
  overflow: scroll;
}

.sentence-item {
  margin-right: 1rem;
}
</style>

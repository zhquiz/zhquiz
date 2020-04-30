<template lang="pug">
.container#Hanzi
  .field
    .control
      input.input(name="q" placeholder="Type here to search." v-model="q" @keydown.enter="onQChange()")
  .columns
    .column.is-6.entry-display
      .font-hanzi.clickable(
        style="font-size: 150px; min-height: 200px;"
        @contextmenu.prevent="(evt) => { selectedHanzi = current; $refs.hanziContextmenu.open(evt) }"
      ) {{current}}
      .buttons.has-addons
        button.button(@click="i--" :disabled="i < 1") Previous
        button.button(@click="i++" :disabled="i > entries.length - 2") Next
        b-dropdown(hoverable aria-role="list")
          button.button(slot="trigger")
            fontawesome(icon="caret-down")
          b-dropdown-item(aria-role="listitem") Search in MDBG
    .column.is-6
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!sub")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Subcompositions
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in sub" :key="h"
            @contextmenu.prevent="(evt) => { selectedHanzi = h; $refs.hanziContextmenu.open(evt) }"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!sup")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Supercompositions
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in sup" :key="h"
            @contextmenu.prevent="(evt) => { selectedHanzi = h; $refs.hanziContextmenu.open(evt) }"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!variants")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Variants
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in variants" :key="h"
            @contextmenu.prevent="(evt) => { selectedHanzi = h; $refs.hanziContextmenu.open(evt) }"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="vocabs.length > 0")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Vocabularies
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          div(v-for="v, i in vocabs" :key="i")
            span.clickable.vocab-part(
              @contextmenu.prevent="(evt) => { selectedVocab = v.simplified; $refs.vocabContextmenu.open(evt) }"
            ) {{v.simplified}}&nbsp;
            span.clickable.vocab-part(v-if="v.traditional"
              @contextmenu.prevent="(evt) => { selectedVocab = v.traditional; $refs.vocabContextmenu.open(evt) }"
            ) {{v.traditional}}&nbsp;
            span.vocab-part(style="min-width: 8em;") [{{v.pinyin}}]&nbsp;
            span.vocab-part {{v.english}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="sentences.length > 0")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Sentences
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          div(v-for="s, i in sentences" :key="i")
            span.clickable.sentence-part(
              @contextmenu.prevent="(evt) => { selectedSentence = s.chinese; $refs.sentenceContextmenu.open(evt) }"
            ) {{s.chinese}}&nbsp;
            span.sentence-part {{s.english}}
  vue-context(ref="hanziContextmenu" lazy)
    li
      a(role="button" @click.prevent="speak(selectedHanzi)") Speak
    li(v-if="!hanziIds[selectedHanzi]")
      a(role="button" @click.prevent="addToQuiz(selectedHanzi, 'hanzi')") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(selectedHanzi, 'hanzi')") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: selectedHanzi } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: selectedHanzi } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${selectedHanzi}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="vocabContextmenu" lazy)
    li
      a(role="button" @click.prevent="speak(selectedVocab)") Speak
    li(v-if="!vocabIds[selectedVocab]")
      a(role="button" @click.prevent="addToQuiz(selectedVocab, 'vocab')") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(selectedVocab, 'vocab')") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: selectedVocab } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: selectedVocab } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${selectedVocab}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="sentenceContextmenu" lazy)
    li
      a(role="button" @click.prevent="speak(selectedSentence)") Speak
    li(v-if="!sentenceIds[selectedSentence] || !sentenceIds[selectedSentence].length")
      a(role="button" @click.prevent="addToQuiz(selectedSentence, 'sentence')") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(selectedSentence, 'sentence')") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: selectedSentence } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: selectedSentence } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${selectedSentence}`"
        target="_blank" rel="noopener") Open in MDBG
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import XRegExp from 'xregexp'
import { AxiosInstance } from 'axios'

import { speak } from '../utils'

@Component
export default class Hanzi extends Vue {
  entries: string[] = [];
  i: number = 0;

  sub = '';
  sup = '';
  variants = '';
  vocabs: any[] = [];
  sentences: any[] = [];

  selectedHanzi = '';
  selectedVocab = '';
  selectedSentence = '';

  hanziIds: any = {};
  vocabIds: any = {};
  sentenceIds: any = {};

  q = ''

  speak = speak;

  get current () {
    return this.entries[this.i]
  }

  created () {
    const q = this.$route.query.q
    this.q = (Array.isArray(q) ? q[0] : q) || ''
    this.onQChange()
  }

  async getApi (silent = true) {
    return (await this.$store.dispatch('getApi', silent)) as AxiosInstance
  }

  onQChange () {
    if (this.$route.query.q !== this.q) {
      this.$router.push({ query: { q: this.q } })
    }

    const qs = this.q.split('').filter(h => XRegExp('\\p{Han}').test(h))
    this.$set(
      this,
      'entries',
      qs.filter((h, i) => qs.indexOf(h) === i)
    )
    this.i = 0
    this.load()
  }

  @Watch('$store.state.user')
  @Watch('current')
  load () {
    if (this.$store.state.user) {
      this.loadHanzi()
      this.loadVocab()
      this.loadSentences()
    }
  }

  async loadHanzi () {
    const api = await this.getApi()
    const r = (await api.post('/api/hanzi/match', { entry: this.current })).data
      .result
    this.sub = r.sub
    this.sup = r.sup
    this.variants = r.var
  }

  async loadVocab () {
    const api = await this.getApi()
    const r = (await api.post('/api/vocab/q', { entry: this.current })).data
    this.$set(this, 'vocabs', r.result)
  }

  async loadSentences () {
    const api = await this.getApi()
    const r = (await api.post('/api/sentence/q', { entry: this.current })).data
    this.$set(this, 'sentences', r.result)
  }

  @Watch('selectedHanzi')
  async loadHanziStatus () {
    if (this.selectedHanzi) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          item: this.selectedHanzi,
          type: 'hanzi'
        },
        projection: { _id: 1 },
        hasCount: false
      })
      this.$set(this.hanziIds, this.selectedHanzi, !!r.data.result.length)
    }
  }

  @Watch('selectedVocab')
  async loadVocabStatus () {
    if (this.selectedVocab) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          item: this.selectedVocab,
          type: 'vocab'
        },
        projection: { _id: 1 },
        hasCount: false
      })
      this.$set(this.vocabIds, this.selectedVocab, !!r.data.result.length)
    }
  }

  @Watch('selectedSentence')
  async loadSentenceStatus () {
    if (this.selectedSentence) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: { item: this.selectedSentence, type: 'sentence' },
        hasCount: false,
        projection: {
          _id: 1
        }
      })
      this.$set(this.sentenceIds, this.selectedSentence, r.data.result.map((d: any) => d._id))
    }
  }

  async addToQuiz (item: string, type: string) {
    const api = await this.getApi()
    await api.put('/api/card/', { item, type })
    this.$buefy.snackbar.open(`Added ${type}: ${item} to quiz`)

    type === 'vocab' ? this.loadVocabStatus() : this.loadHanziStatus()
  }

  async removeFromQuiz (item: string, type: string) {
    const api = await this.getApi()
    const ids =
      (type === 'vocab' ? this.vocabIds[item] : this.hanziIds[item]) || []
    await Promise.all(
      ids.map((id: string) =>
        api.delete('/api/card/', {
          data: { id }
        })
      )
    )
    this.$buefy.snackbar.open(`Removed ${type}: ${item} from quiz`)

    type === 'vocab' ? this.loadVocabStatus() : this.loadHanziStatus()
  }
}
</script>

<style lang="scss">
#Hanzi {
  .entry-display {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .card-content {
    max-height: calc(100vh - 500px);
    overflow: scroll;
  }

  .vocab-part {
    display: inline-block;
    min-width: 4em;
  }
}
</style>

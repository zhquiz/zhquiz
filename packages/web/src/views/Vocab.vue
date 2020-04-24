<template lang="pug">
.container#Vocab
  form.field
    .control
      input.input(name="q" placeholder="Type here to search." :value="q")
  .columns
    .column.is-6.entry-display
      .font-hanzi(style="font-size: 120px; min-height: 200px; position: relative;")
        .clickable.text-center(
          @contextmenu.prevent="(evt) => { selectedVocab = simplified; $refs.vocabContextmenu.open(evt) }"
        ) {{simplified}}
        b-loading(:active="isQLoading" :is-full-page="false")
      .buttons.has-addons
        button.button(@click="i--" :disabled="i < 1") Previous
        button.button(@click="i++" :disabled="i > entries.length - 2") Next
        b-dropdown(hoverable aria-role="list")
          button.button(slot="trigger")
            fontawesome(icon="caret-down")
          b-dropdown-item(aria-role="listitem") Search in MDBG
    .column.is-6
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="typeof current === 'object'")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Reading
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span {{current.pinyin}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!current.traditional")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Traditional
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          .font-hanzi.clickable(style="font-size: 60px; height: 80px;"
            @contextmenu.prevent="(evt) => { selectedVocab = current.traditional; $refs.vocabContextmenu.open(evt) }"
          ) {{current.traditional}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="typeof current === 'object'")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title English
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span {{current.english}}
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
  vue-context(ref="vocabContextmenu")
    li
      a(role="button" @click.prevent="speak(selectedVocab)") Speak
    li
      router-link(:to="{ path: '/vocab', query: { q: selectedVocab } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: selectedVocab } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${selectedVocab}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="sentenceContextmenu")
    li
      a(role="button" @click.prevent="speak(selectedSentence)") Speak
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
export default class Vocab extends Vue {
  entries: string[] = []
  i: number = 0
  isQLoading = false

  sentences: any[] = []

  selectedVocab = ''
  selectedSentence = ''

  speak = speak

  get current () {
    return this.entries[this.i] || '' as any
  }

  get simplified () {
    return typeof this.current === 'string' ? this.current : this.current.simplified
  }

  get q () {
    return this.$route.query.q as string || ''
  }

  created () {
    this.onQChange()
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('q')
  async onQChange () {
    if (this.q) {
      this.isQLoading = true
      const api = await this.getApi()

      let qs = (await api.post('/api/lib/jieba', { entry: this.q })).data.result as string[]
      qs = qs.filter(h => XRegExp('\\p{Han}+').test(h))
      this.$set(this, 'entries', qs.filter((h, i) => qs.indexOf(h) === i))
      this.loadContent()
    }

    this.i = 0
    this.isQLoading = false
  }

  loadContent () {
    this.loadVocab()
    this.loadSentences()
  }

  @Watch('current')
  async loadVocab () {
    if (typeof this.current === 'string') {
      const api = await this.getApi()

      const vs = (await api.post('/api/vocab/match', { entry: this.current })).data.result as any[]

      if (vs.length > 0) {
        this.entries = [
          ...this.entries.slice(0, this.i),
          ...vs,
          ...this.entries.slice(this.i + 1)
        ]
      }
    }
  }

  @Watch('simplified')
  async loadSentences () {
    const api = await this.getApi()
    const ss = (await api.post('/api/sentence/q', { entry: this.simplified })).data.result as any[]
    this.$set(this, 'sentences', ss)
  }
}
</script>

<style lang="scss">
#Vocab {
  .entry-display {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .card-content {
    max-height: calc(100vh - 500px);
    overflow: scroll;
  }
}
</style>

<template lang="pug">
.container#Vocab
  form.field
    .control
      input.input(name="q" placeholder="Type here to search." :value="q")
  .columns
    .column.is-6.entry-display
      .font-hanzi(style="font-size: 120px; height: 200px; position: relative;")
        span.clickable {{simplified}}
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
        .card-content(style="position: relative; height: 100px;")
          span {{current.pinyin}}
          b-loading(:active="!current.pinyin" :is-full-page="false")
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!current.traditional")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Traditional
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          .font-hanzi.clickable(style="font-size: 60px; height: 80px;") {{current.traditional}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="typeof current === 'object'")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title English
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content(style="position: relative; height: 100px;")
          span {{current.english}}
          b-loading(:active="typeof current === 'object' && !current.english" :is-full-page="false")
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="sentences.length > 0")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Sentences
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          div(v-for="s, i in sentences" :key="i")
            span.clickable.sentence-part {{s.chinese}}&nbsp;
            span.sentence-part {{s.english}}
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import XRegExp from 'xregexp'

import { api } from '../utils'

@Component
export default class Vocab extends Vue {
  entries: string[] = []
  i: number = 0
  isQLoading = false

  sentences: any[] = []

  get current () {
    return this.entries[this.i] || '' as any
  }

  get simplified () {
    return typeof this.current === 'string' ? this.current : this.current.simplified
  }

  get q () {
    return this.$route.query.q as string || ''
  }

  mounted () {
    this.onQChange()
  }

  @Watch('q')
  async onQChange () {
    if (this.q) {
      this.isQLoading = true
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

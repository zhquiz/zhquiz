<template lang="pug">
.container#Vocab
  form.field
    .control
      input.input(name="q" placeholder="Type here to search." :value="q")
  .columns
    .column.is-6.entry-display
      .font-hanzi(style="font-size: 120px; min-height: 200px; position: relative;")
        span.clickable.text-center(
          @contextmenu="(evt) => { selectedVocab = simplified; $refs.vocabContextmenu.show(evt) }"
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
            @contextmenu="(evt) => { selectedVocab = current.traditional; $refs.vocabContextmenu.show(evt) }"
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
              @contextmenu="(evt) => { selectedSentence = s.chinese; $refs.sentenceContextmenu.show(evt) }"
            ) {{s.chinese}}&nbsp;
            span.sentence-part {{s.english}}
  p-contextmenu(ref="vocabContextmenu" :model="vocabContextmenuItems")
  p-contextmenu(ref="sentenceContextmenu" :model="sentenceContextmenuItems")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import XRegExp from 'xregexp'

import { api, speak } from '../utils'

@Component
export default class Vocab extends Vue {
  entries: string[] = []
  i: number = 0
  isQLoading = false

  sentences: any[] = []

  selectedVocab = ''
  selectedSentence = ''

  get current () {
    return this.entries[this.i] || '' as any
  }

  get simplified () {
    return typeof this.current === 'string' ? this.current : this.current.simplified
  }

  get q () {
    return this.$route.query.q as string || ''
  }

  get vocabContextmenuItems () {
    const v = this.selectedVocab

    return [
      {
        label: 'Speak',
        command: () => speak(v)
      },
      {
        label: 'Search for vocab',
        url: this.$router.resolve({
          path: '/vocab',
          query: {
            q: v
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Search for Hanzi',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: v
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Open in MDBG',
        url: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${v}*`,
        target: '_blank'
      }
    ]
  }

  get sentenceContextmenuItems () {
    return [
      {
        label: 'Speak',
        command: () => speak(this.selectedSentence)
      },
      {
        label: 'Search for vocab',
        url: this.$router.resolve({
          path: '/vocab',
          query: {
            q: this.selectedSentence
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Search for Hanzi',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: this.selectedSentence
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Open in MDBG',
        url: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${this.selectedSentence}`,
        target: '_blank'
      }
    ]
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

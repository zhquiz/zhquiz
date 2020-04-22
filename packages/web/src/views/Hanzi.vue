<template lang="pug">
.container#Hanzi
  form.field
    .control
      input.input(name="q" placeholder="Type here to search." :value="q")
  .columns
    .column.is-6.entry-display
      .font-hanzi.clickable(style="font-size: 150px; height: 200px;") {{current}}
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
            role="button" @click="$router.push({ query: { q: h }})"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!sup")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Supercompositions
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in sup" :key="h"
            role="button" @click="$router.push({ query: { q: h }})"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!variants")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Variants
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in variants" :key="h"
            role="button" @click="$router.push({ query: { q: h }})"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="vocabs.length > 0")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Vocabularies
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          div(v-for="v, i in vocabs" :key="i")
            span.clickable.vocab-part {{v.simplified}}&nbsp;
            span.clickable.vocab-part(v-if="v.traditional") {{v.traditional}}&nbsp;
            span.vocab-part(style="min-width: 8em;") [{{v.pinyin}}]&nbsp;
            span.vocab-part {{v.english}}
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import XRegExp from 'xregexp'
import { api } from '../utils'

@Component
export default class Hanzi extends Vue {
  entries: string[] = []
  i: number = 0

  sub = ''
  sup = ''
  variants = ''
  vocabs: any[] = []

  get current () {
    return this.entries[this.i]
  }

  get q () {
    return this.$route.query.q as string || ''
  }

  mounted () {
    this.onQChange()
  }

  @Watch('q')
  onQChange () {
    const qs = this.q.split('').filter(h => XRegExp('\\p{Han}').test(h))
    this.$set(this, 'entries', qs.filter((h, i) => qs.indexOf(h) === i))
    this.i = 0
    this.load()
  }

  @Watch('current')
  load () {
    this.loadHanzi()
    this.loadVocab()
  }

  async loadHanzi () {
    const r = (await api.post('/api/hanzi/match', { entry: this.current })).data.result
    this.sub = r.sub
    this.sup = r.sup
    this.variants = r.var
  }

  async loadVocab () {
    const r = (await api.post('/api/vocab/q', { entry: this.current })).data
    this.$set(this, 'vocabs', r.result)
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

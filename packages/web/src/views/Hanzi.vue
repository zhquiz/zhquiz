<template lang="pug">
.container#Hanzi
  form.field
    .control
      input.input(name="q" placeholder="Type here to search." :value="q")
  .columns
    .column.is-6.entry-display
      .font-hanzi.clickable(
        style="font-size: 150px; min-height: 200px;"
        @contextmenu="(evt) => { selectedHanzi = current; $refs.hanziContextmenu.show(evt) }"
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
            @contextmenu="(evt) => { selectedHanzi = h; $refs.hanziContextmenu.show(evt) }"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!sup")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Supercompositions
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in sup" :key="h"
            @contextmenu="(evt) => { selectedHanzi = h; $refs.hanziContextmenu.show(evt) }"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="!!variants")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Variants
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          span.font-hanzi.clickable(style="font-size: 50px;"
            v-for="h in variants" :key="h"
            @contextmenu="(evt) => { selectedHanzi = h; $refs.hanziContextmenu.show(evt) }"
          ) {{h}}
      b-collapse.card(animation="slide" style="margin-bottom: 1em;" :open="vocabs.length > 0")
        .card-header(slot="trigger" slot-scope="props" role="button")
          h2.card-header-title Vocabularies
          a.card-header-icon
            fontawesome(:icon="props.open ? 'caret-down' : 'caret-up'")
        .card-content
          div(v-for="v, i in vocabs" :key="i")
            span.clickable.vocab-part(
              @contextmenu="(evt) => { selectedVocab = v.simplified; $refs.vocabContextmenu.show(evt) }"
            ) {{v.simplified}}&nbsp;
            span.clickable.vocab-part(v-if="v.traditional"
              @contextmenu="(evt) => { selectedVocab = v.traditional; $refs.vocabContextmenu.show(evt) }"
            ) {{v.traditional}}&nbsp;
            span.vocab-part(style="min-width: 8em;") [{{v.pinyin}}]&nbsp;
            span.vocab-part {{v.english}}
  p-contextmenu(ref="hanziContextmenu" :model="hanziContextmenuItems")
  p-contextmenu(ref="vocabContextmenu" :model="vocabContextmenuItems")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import XRegExp from 'xregexp'
import { api, speak } from '../utils'

@Component
export default class Hanzi extends Vue {
  entries: string[] = []
  i: number = 0

  sub = ''
  sup = ''
  variants = ''
  vocabs: any[] = []

  selectedHanzi = ''
  selectedVocab = ''

  get current () {
    return this.entries[this.i]
  }

  get q () {
    return this.$route.query.q as string || ''
  }

  get hanziContextmenuItems () {
    const h = this.selectedHanzi

    return [
      {
        label: 'Speak',
        command: () => speak(h)
      },
      {
        label: 'Search for Hanzi',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: h
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Open in MDBG',
        url: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${h}*`,
        target: '_blank'
      }
    ]
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

  created () {
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

<template lang="pug">
article#Home
  .columns(style="width: 100%; margin-top: 1em;")
    .column.is-6
      .item-display
        .font-hanzi.clickable(style="font-size: 50px;"
          @contextmenu="(evt) => $refs.hanziContextmenu.show(evt)"
        ) {{hanzi}}
        b-loading(:active="!hanzi" :is-full-page="false")
      center Hanzi of the day
    .column.is-6
      .item-display
        .font-hanzi.clickable(style="font-size: 50px;"
          @contextmenu="(evt) => $refs.vocabContextmenu.show(evt)"
        ) {{vocab}}
        b-loading(:active="!vocab" :is-full-page="false")
      center Vocab of the day
  .item-display
    .font-hanzi.clickable(style="font-size: 30px;"
      @contextmenu="(evt) => $refs.sentenceContextmenu.show(evt)"
    ) {{sentence}}
    b-loading(:active="!sentence" :is-full-page="false")
  center Sentence of the day
  p-contextmenu(ref="hanziContextmenu" :model="hanziContextmenuItems")
  p-contextmenu(ref="vocabContextmenu" :model="vocabContextmenuItems")
  p-contextmenu(ref="sentenceContextmenu" :model="sentenceContextmenuItems")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'

import { api, speak } from '../utils'

@Component
export default class Home extends Vue {
  hanzi = ''
  vocab = ''
  sentence = ''

  level = 23

  get hanziContextmenuItems () {
    return [
      {
        label: 'Speak',
        command: () => speak(this.hanzi)
      },
      {
        label: 'Search',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: this.hanzi
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Open in MDBG',
        url: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${this.hanzi}*`,
        target: '_blank'
      }
    ]
  }

  get vocabContextmenuItems () {
    return [
      {
        label: 'Speak',
        command: () => speak(this.vocab)
      },
      {
        label: 'Search as vocab',
        url: this.$router.resolve({
          path: '/vocab',
          query: {
            q: this.vocab
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Search as hanzi',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: this.vocab
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Open in MDBG',
        url: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${this.vocab}*`,
        target: '_blank'
      }
    ]
  }

  get sentenceContextmenuItems () {
    return [
      {
        label: 'Speak',
        command: () => speak(this.sentence)
      },
      {
        label: 'Search as vocab',
        url: this.$router.resolve({
          path: '/vocab',
          query: {
            q: this.sentence
          }
        }).href,
        target: '_blank'
      },
      {
        label: 'Search as hanzi',
        url: this.$router.resolve({
          path: '/hanzi',
          query: {
            q: this.sentence
          }
        }).href,
        target: '_blank'
      }
    ]
  }

  mounted () {
    this.loadHanzi()
    this.loadVocab()
    this.loadSentence()
  }

  async loadHanzi () {
    this.hanzi = (await api.post('/api/hanzi/random', { level: this.level })).data.result || ' '
  }

  async loadVocab () {
    this.vocab = (await api.post('/api/vocab/random', { level: this.level })).data.result || ' '
  }

  async loadSentence () {
    this.sentence = (await api.post('/api/sentence/random', { level: this.level })).data.result || ' '
  }
}
</script>

<style lang="scss">
#Home {
  display: flex;
  flex-direction: column;
  align-items: center;

  .item-display {
    height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 1em;
    position: relative;
  }
}
</style>

<template lang="pug">
article#Home
  b-input.has-shadow(type="textarea" style="width: 80%; height: 150px;"
    v-model="value" placeholder="Type or paste text here to get pinyin")
  div(style="width: 80%; min-height: 150px;") {{pinyin}}
  .columns(style="width: 100%;")
    .column.is-6
      .item-display
        .font-hanzi.clickable(style="font-size: 50px;"
          role="button" @click="$router.push({ path: '/hanzi', query: { q: hanzi } })"
        ) {{hanzi}}
      center Hanzi of the day
    .column.is-6
      .item-display
        .font-hanzi(style="font-size: 50px;") {{vocab}}
      center Vocab of the day
  .item-display
    .font-hanzi(style="font-size: 30px;") {{sentence}}
  center Sentence of the day
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'

import { api } from '../utils'

@Component
export default class Home extends Vue {
  value = ''
  pinyin = ''
  hanzi = ''
  vocab = ''
  sentence = ''

  level = 23

  mounted () {
    this.loadHanzi()
    this.loadVocab()
    this.loadSentence()
  }

  @Watch('value')
  async onTextChange () {
    this.pinyin = (await api.post('/api/lib/pinyin', { entry: this.value })).data.result
  }

  async loadHanzi () {
    this.hanzi = (await api.post('/api/hanzi/random', { level: this.level })).data.result
  }

  async loadVocab () {
    this.vocab = (await api.post('/api/vocab/random', { level: this.level })).data.result
  }

  async loadSentence () {
    this.sentence = (await api.post('/api/sentence/random', { level: this.level })).data.result
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
  }
}
</style>

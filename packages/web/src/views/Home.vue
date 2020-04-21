<template lang="pug">
article.flex.flex-col.w-full.items-center.justify-center
  textarea.shadow.text-base.m-3.p-3(class="w-4/5" style="height: 150px;"
    v-model="value" placeholder="Type or paste text here to get pinyin")
  .text-base(class="w-4/5" style="min-height: 150px;") {{pinyin}}
  .flex.flex-row.w-full
    .flex.flex-col.items-center.justify-center.flex-grow
      .h-24.flex.flex-col.items-center.justify-end
        .text-6xl.font-hanzi.p-3 {{hanzi}}
      div Hanzi of the day
    .flex.flex-col.items-center.justify-center.flex-grow
      .h-24.flex.flex-col.items-center.justify-end
        .text-6xl.font-hanzi.p-3 {{vocab}}
      div Vocab of the day
  .h-24.flex.flex-col.items-center.justify-end
    .text-3xl.font-hanzi {{sentence}}
  div Sentence of the day
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

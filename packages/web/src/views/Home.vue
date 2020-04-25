<template lang="pug">
article#Home
  .columns(style="width: 100%; margin-top: 1em;")
    .column.is-6
      .item-display
        .font-hanzi.clickable(style="font-size: 50px; min-height: 60px;"
          @contextmenu.prevent="(evt) => $refs.hanziContextmenu.open(evt)"
        ) {{hanzi.item}}
        b-loading(:active="!hanzi.item" :is-full-page="false")
      center Hanzi of the day
    .column.is-6
      .item-display
        .font-hanzi.clickable(style="font-size: 50px; min-height: 60px;"
          @contextmenu.prevent="(evt) => $refs.vocabContextmenu.open(evt)"
        ) {{vocab.item}}
        b-loading(:active="!vocab.item" :is-full-page="false")
      center Vocab of the day
  .item-display
    .font-hanzi.clickable.text-center(style="font-size: 30px; min-width: 3em; min-height: 40px"
      @contextmenu.prevent="(evt) => $refs.sentenceContextmenu.open(evt)"
    ) {{sentence.item}}
    b-loading(:active="!sentence.item" :is-full-page="false")
  center Sentence of the day
  vue-context(ref="hanziContextmenu" lazy)
    li
      a(role="button" @click.prevent="loadHanzi()") Reload
    li
      a(role="button" @click.prevent="speak(hanzi.item)") Speak
    li(v-if="!hanzi.id.length")
      a(role="button" @click.prevent="addToQuiz(hanzi)") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(hanzi)") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: hanzi.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: hanzi.item } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${hanzi.item}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="vocabContextmenu" lazy)
    li
      a(role="button" @click.prevent="loadVocab()") Reload
    li
      a(role="button" @click.prevent="speak(vocab.item)") Speak
    li(v-if="!vocab.id.length")
      a(role="button" @click.prevent="addToQuiz(vocab)") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(vocab)") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: vocab.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: vocab.item } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${vocab.item}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="sentenceContextmenu" lazy)
    li
      a(role="button" @click.prevent="loadHanzi()") Reload
    li
      a(role="button" @click.prevent="speak(sentence.item)") Speak
    li(v-if="!sentence.id.length")
      a(role="button" @click.prevent="addToQuiz(sentence)") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(sentence)") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: sentence.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: sentence.item } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${sentence.item}`"
        target="_blank" rel="noopener") Open in MDBG
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { AxiosInstance } from 'axios'

import { speak } from '../utils'

@Component
export default class Home extends Vue {
  hanzi = {
    type: 'hanzi',
    item: null,
    id: []
  }

  vocab = {
    type: 'vocab',
    item: null,
    id: []
  }

  sentence = {
    type: 'sentence',
    item: null,
    id: []
  }

  levelMin = 0
  level = 0

  speak = speak

  created () {
    this.onUserChanged()
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('$store.state.user')
  async onUserChanged () {
    if (this.$store.state.user) {
      const api = await this.getApi()
      const r = await api.get('/api/user/')
      const data = r.data
      if (data) {
        this.levelMin = data.levelMin || 1
        this.level = data.level || 60
      }
    }
  }

  @Watch('level')
  async loadHanzi () {
    if (this.level) {
      const api = await this.getApi()
      this.hanzi.item = (await api.post('/api/hanzi/random', {
        levelMin: this.levelMin,
        level: this.level
      })).data.result
      await this.getQuizStatus(this.hanzi)
    }
  }

  @Watch('level')
  async loadVocab () {
    if (this.level) {
      const api = await this.getApi()
      this.vocab.item = (await api.post('/api/vocab/random', {
        levelMin: this.levelMin,
        level: this.level
      })).data.result
      await this.getQuizStatus(this.vocab)
    }
  }

  @Watch('level')
  async loadSentence () {
    if (this.level) {
      const api = await this.getApi()
      this.sentence.item = (await api.post('/api/sentence/random', {
        levelMin: this.levelMin,
        level: this.level
      })).data.result
      await this.getQuizStatus(this.sentence)
    }
  }

  async getQuizStatus (item: any) {
    const vm = this as any

    if (this.$store.state.user) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          item: item.item,
          type: item.type
        },
        projection: { _id: 1 },
        hasCount: false
      })

      this.$set(vm[item.type], 'id', r.data.result.map((el: any) => el._id))
    } else {
      this.$set(vm[item.type], 'id', [])
    }
  }

  async addToQuiz (item: any) {
    if (this.$store.state.user) {
      const api = await this.getApi()
      await api.put('/api/card/', item)
      this.getQuizStatus(item)

      this.$buefy.snackbar.open(`Added ${item.type}: ${item.item} to quiz`)
    }
  }

  async removeFromQuiz (item: any) {
    if (this.$store.state.user) {
      const vm = this as any

      const api = await this.getApi()
      await Promise.all(vm[item.type].id.map((i: string) => api.delete('/api/card/', {
        data: { id: i }
      })))
      this.getQuizStatus(item)

      this.$buefy.snackbar.open(`Removed ${item.type}: ${item.item} from quiz`)
    }
  }
}
</script>

<style lang="scss">
#Home {
  display: flex;
  flex-direction: column;
  align-items: center;

  .item-display {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 1em;
    position: relative;
  }
}
</style>

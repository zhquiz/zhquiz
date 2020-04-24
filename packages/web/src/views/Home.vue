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
  vue-context(ref="hanziContextmenu")
    li
      a(role="button" @click.prevent="loadHanzi()") Reload
    li
      a(role="button" @click.prevent="speak(hanzi.item)") Speak
    li(v-if="hanzi.status === false")
      a(role="button" @click.prevent="addToLesson(hanzi)") Add to lesson
    li(v-else-if="hanzi.status === true")
      a(role="button" @click.prevent="removeFromLesson(hanzi)") Remove from lesson
    li
      router-link(:to="{ path: '/hanzi', query: { q: hanzi.item } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${hanzi.item}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="vocabContextmenu")
    li
      a(role="button" @click.prevent="loadVocab()") Reload
    li
      a(role="button" @click.prevent="speak(vocab.item)") Speak
    li(v-if="vocab.status === false")
      a(role="button" @click.prevent="addToLesson(vocab)") Add to lesson
    li(v-else-if="vocab.status === true")
      a(role="button" @click.prevent="removeFromLesson(vocab)") Remove from lesson
    li
      router-link(:to="{ path: '/vocab', query: { q: vocab.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: vocab.item } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${vocab.item}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="sentenceContextmenu")
    li
      a(role="button" @click.prevent="loadHanzi()") Reload
    li
      a(role="button" @click.prevent="speak(sentence.item)") Speak
    li(v-if="sentence.status === false")
      a(role="button" @click.prevent="addToLesson(sentence)") Add to lesson
    li(v-else-if="sentence.status === true")
      a(role="button" @click.prevent="removeFromLesson(sentence)") Remove from lesson
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
import firebase, { User } from 'firebase/app'
import { AxiosInstance } from 'axios'

import { speak } from '../utils'

@Component
export default class Home extends Vue {
  hanzi = {
    type: 'hanzi',
    item: null,
    status: null as null | boolean
  }

  vocab = {
    type: 'vocab',
    item: null,
    status: null as null | boolean
  }

  sentence = {
    type: 'sentence',
    item: null,
    status: null as null | boolean
  }

  levelMin = 0
  level = 0

  speak = speak

  get user () {
    const u = this.$store.state.user as User | null
    return u ? u.email : undefined
  }

  created () {
    this.onUserChanged()
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('user')
  async onUserChanged () {
    if (this.user) {
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
      await this.getLessonStatus(this.hanzi)
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
      await this.getLessonStatus(this.vocab)
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
      await this.getLessonStatus(this.sentence)
    }
  }

  async getLessonStatus (item: any) {
    const vm = this as any

    if (this.user) {
      const api = await this.getApi()
      const r = await api.post('/api/card/match', item)

      const doc = r.data

      this.$set(vm[item.type], 'status', !!doc)
      this.$set(vm[item.type], 'id', doc ? doc._id : null)
    } else {
      this.$set(vm[item.type], 'status', null)
      this.$set(vm[item.type], 'id', null)
    }
  }

  async addToLesson (item: any) {
    if (this.user) {
      const api = await this.getApi()
      await api.put('/api/card/', item)
      this.getLessonStatus(item)
    }
  }

  async removeFromLesson (item: any) {
    if (this.user) {
      const api = await this.getApi()
      await api.delete('/api/card/', {
        data: item
      })
      this.getLessonStatus(item)
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

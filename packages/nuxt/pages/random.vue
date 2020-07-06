<template>
  <section class="RandomPage">
    <div class="columns w-full">
      <div class="column is-6">
        <div class="item-display item-display-top">
          <div
            class="font-hanamin hanzi clickable"
            @contextmenu.prevent="(evt) => $refs.hanziContextmenu.open(evt)"
          >
            {{ hanzi.item }}
          </div>
          <b-loading :active="!hanzi.item" :is-full-page="false"></b-loading>
        </div>
        <center>Hanzi of the day</center>
      </div>

      <div class="column is-6">
        <div class="item-display item-display-top">
          <div
            class="font-chinese hanzi clickable"
            @contextmenu.prevent="(evt) => $refs.vocabContextmenu.open(evt)"
          >
            {{ vocab.item }}
          </div>
          <b-loading :active="!vocab.item" :is-full-page="false"></b-loading>
        </div>
        <center>Vocab of the day</center>
      </div>
    </div>

    <div class="item-display item-display-bottom">
      <div
        class="font-chinese hanzi clickable text-center"
        @contextmenu.prevent="(evt) => $refs.sentenceContextmenu.open(evt)"
      >
        {{ sentence.item }}
      </div>
      <b-loading :active="!sentence.item" :is-full-page="false" />
    </div>
    <center>Sentence of the day</center>

    <client-only>
      <vue-context ref="hanziContextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="loadHanzi"
            @keypress.prevent="loadHanzi"
          >
            Reload
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="speak(hanzi.item)"
            @keypress.prevent="speak(hanzi.item)"
          >
            Speak
          </a>
        </li>
        <li v-if="!hanzi.id.length">
          <a
            role="button"
            @click.prevent="addToQuiz(hanzi)"
            @keypress.prevent="addToQuiz(hanzi)"
          >
            Add to quiz
          </a>
        </li>
        <li v-else>
          <a
            role="button"
            @click.prevent="removeFromQuiz(hanzi)"
            @keypress.prevent="removeFromQuiz(hanzi)"
          >
            Remove from quiz
          </a>
        </li>
        <li>
          <nuxt-link
            :to="{ path: '/vocab', query: { q: hanzi.item } }"
            target="_blank"
          >
            Search for vocab
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            :to="{ path: '/hanzi', query: { q: hanzi.item } }"
            target="_blank"
          >
            Search for Hanzi
          </nuxt-link>
        </li>
        <li>
          <a
            :href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${hanzi.item}*`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in MDBG
          </a>
        </li>
      </vue-context>

      <vue-context ref="vocabContextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="loadVocab"
            @keypress.prevent="loadVocab"
          >
            Reload
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="speak(vocab.item)"
            @keypress.prevent="speak(vocab.item)"
          >
            Speak
          </a>
        </li>
        <li v-if="!vocab.id.length">
          <a
            role="button"
            @click.prevent="addToQuiz(vocab)"
            @keypress.prevent="addToQuiz(vocab)"
          >
            Add to quiz
          </a>
        </li>
        <li v-else>
          <a
            role="button"
            @click.prevent="removeFromQuiz(vocab)"
            @keypress.prevent="removeFromQuiz(vocab)"
          >
            Remove from quiz
          </a>
        </li>
        <li>
          <nuxt-link
            :to="{ path: '/vocab', query: { q: vocab.item } }"
            target="_blank"
          >
            Search for vocab
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            :to="{ path: '/hanzi', query: { q: vocab.item } }"
            target="_blank"
          >
            Search for Hanzi
          </nuxt-link>
        </li>
        <li>
          <a
            :href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${vocab.item}*`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in MDBG
          </a>
        </li>
      </vue-context>

      <vue-context ref="sentenceContextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="loadSentence"
            @keypress.prevent="loadSentence"
          >
            Reload
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="speak(sentence.item)"
            @keypress.prevent="speak(sentence.item)"
          >
            Speak
          </a>
        </li>
        <li v-if="!sentence.id.length">
          <a
            role="button"
            @click.prevent="addToQuiz(sentence)"
            @keypress.prevent="addToQuiz(sentence)"
          >
            Add to quiz
          </a>
        </li>
        <li v-else>
          <a
            role="button"
            @click.prevent="removeFromQuiz(sentence)"
            @keypress.prevent="removeFromQuiz(sentence)"
          >
            Remove from quiz
          </a>
        </li>
        <li>
          <nuxt-link
            :to="{ path: '/vocab', query: { q: sentence.item } }"
            target="_blank"
          >
            Search for vocab
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            :to="{ path: '/hanzi', query: { q: sentence.item } }"
            target="_blank"
          >
            Search for Hanzi
          </nuxt-link>
        </li>
        <li>
          <a
            :href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${sentence.item}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in MDBG
          </a>
        </li>
      </vue-context>
    </client-only>
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'nuxt-property-decorator'

import { speak } from '~/assets/speak'

@Component({
  layout: 'app',
})
export default class RandomPage extends Vue {
  hanzi = {
    type: 'hanzi',
    item: null,
    id: [],
  }

  vocab = {
    type: 'vocab',
    item: null,
    id: [],
  }

  sentence = {
    type: 'sentence',
    item: null,
    id: [],
  }

  levelMin = 0
  level = 0

  speak = speak

  created() {
    this.onUserChanged()
  }

  @Watch('$store.state.user')
  async onUserChanged() {
    if (this.$store.state.user) {
      const { levelMin, level } = await this.$axios.$get('/api/user/')
      this.levelMin = levelMin || 1
      this.level = level || 60
    }
  }

  @Watch('level')
  async loadHanzi() {
    if (this.level) {
      this.hanzi.item = (
        await this.$axios.$post('/api/hanzi/random', {
          levelMin: this.levelMin,
          level: this.level,
        })
      ).result
      await this.getQuizStatus(this.hanzi)
    }
  }

  @Watch('level')
  async loadVocab() {
    if (this.level) {
      this.vocab.item = (
        await this.$axios.$post('/api/vocab/random', {
          levelMin: this.levelMin,
          level: this.level,
        })
      ).result
      await this.getQuizStatus(this.vocab)
    }
  }

  @Watch('level')
  async loadSentence() {
    if (this.level) {
      this.sentence.item = (
        await this.$axios.$post('/api/sentence/random', {
          levelMin: this.levelMin,
          level: this.level,
        })
      ).result
      await this.getQuizStatus(this.sentence)
    }
  }

  async getQuizStatus(item: any) {
    const vm = this as any

    if (this.$store.state.user) {
      const { result } = await this.$axios.$post('/api/card/q', {
        cond: {
          item: item.item,
          type: item.type,
        },
        projection: { _id: 1 },
        hasCount: false,
      })

      this.$set(
        vm[item.type],
        'id',
        result.map((el: any) => el._id)
      )
    } else {
      this.$set(vm[item.type], 'id', [])
    }
  }

  async addToQuiz(item: any) {
    if (this.$store.state.user) {
      await this.$axios.$put('/api/card/', item)
      this.getQuizStatus(item)

      this.$buefy.snackbar.open(`Added ${item.type}: ${item.item} to quiz`)
    }
  }

  async removeFromQuiz(item: any) {
    if (this.$store.state.user) {
      const vm = this as any

      await Promise.all(
        vm[item.type].id.map((i: string) =>
          this.$axios.$delete('/api/card/', {
            data: { id: i },
          })
        )
      )
      this.getQuizStatus(item)

      this.$buefy.snackbar.open(`Removed ${item.type}: ${item.item} from quiz`)
    }
  }
}
</script>

<style scoped>
.RandomPage {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.item-display {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 1em;
  position: relative;
}

.item-display-top .hanzi {
  font-size: 50px;
  min-height: 60px;
}

.item-display-bottom .hanzi {
  font-size: 30px;
  min-width: 3em;
  min-height: 40px;
}
</style>

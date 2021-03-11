<template>
  <section class="desktop:overflow-visible">
    <div class="RandomPage">
      <div class="columns w-full">
        <div class="column is-6">
          <div class="item-display item-display-top">
            <b-tooltip :label="character.english">
              <div
                class="font-han hanzi clickable"
                @contextmenu.prevent="(evt) => openContext(evt, 'hanzi')"
              >
                {{ character.entry }}
              </div>
            </b-tooltip>
            <b-loading
              :active="!character.entry"
              :is-full-page="false"
            ></b-loading>
          </div>
          <center>Hanzi of the day</center>
        </div>

        <div class="column is-6">
          <div class="item-display item-display-top">
            <b-tooltip :label="vocabulary.english">
              <div
                class="font-zh-simp hanzi clickable"
                @contextmenu.prevent="(evt) => openContext(evt, 'vocab')"
              >
                {{ vocabulary.entry }}
              </div>
            </b-tooltip>
            <b-loading
              :active="!vocabulary.entry"
              :is-full-page="false"
            ></b-loading>
          </div>
          <center>Vocab of the day</center>
        </div>
      </div>

      <div class="item-display item-display-bottom">
        <b-tooltip :label="sentence.english">
          <div
            class="font-zh-simp hanzi clickable text-center"
            @contextmenu.prevent="(evt) => openContext(evt, 'sentence')"
          >
            {{ sentence.entry }}
          </div>
        </b-tooltip>
        <b-loading :active="!sentence.entry" :is-full-page="false" />
      </div>
      <center>Sentence of the day</center>
    </div>

    <ContextMenu
      ref="context"
      :entry="selected.entry"
      :type="selected.type"
      :additional="selected.additional"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import ContextMenu from '../ContextMenu.vue'
import { IQuizType } from '../cards/QuizCard.vue'

@Component<RandomPage>({
  head() {
    return {
      title: 'Random - ZhQuiz',
    }
  },
  layout: 'app',
  mounted() {
    Promise.all([
      this.character.additional[0].handler(),
      this.vocabulary.additional[0].handler(),
      this.sentence.additional[0].handler(),
    ])
  },
})
export default class RandomPage extends Vue {
  @Ref() context!: ContextMenu

  character = {
    type: 'character',
    entry: '',
    english: '',
    additional: [
      {
        name: 'Reload',
        handler: async () => {
          const settings = this.$store.state.settings

          const { result, english = '' } = await this.$axios
            .get('/api/hanzi/random', {
              params: {
                levelMin: settings.levelMin,
                level: settings.level,
              },
            })
            .then((r) => r.data)

          this.character.entry = result
          this.character.english = english
        },
      },
    ],
  }

  vocabulary = {
    type: 'vocabulary',
    entry: '',
    english: '',
    additional: [
      {
        name: 'Reload',
        handler: async () => {
          const { result, english = '' } = await this.$axios
            .get('/api/vocabulary/random', {
              params: {
                levelMin: this.$store.state.settings.levelMin,
                level: this.$store.state.settings.level,
              },
            })
            .then((r) => r.data)

          this.vocabulary.entry = result
          this.vocabulary.english = english
        },
      },
    ],
  }

  sentence = {
    type: 'sentence',
    entry: '',
    english: '',
    additional: [
      {
        name: 'Reload',
        handler: async () => {
          const { result, english = '' } = await this.$axios
            .get('/api/sentence/random', {
              params: {
                levelMin: this.$store.state.settings.levelMin,
                level: this.$store.state.settings.level,
              },
            })
            .then((r) => r.data)

          this.sentence.entry = result
          this.sentence.english = english.split('\x1F')[0]
        },
      },
    ],
  }

  selected: {
    type?: string
    entry?: string
    additional?: {
      name: string
      handler: () => void
    }[]
  } = {}

  openContext(evt: MouseEvent, type: IQuizType) {
    this.selected = this[type]
    this.selected.type = type
    this.context.open(evt)
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

@media screen and (min-width: 1025px) {
  .desktop\:overflow-visible {
    overflow: visible;
  }
}
</style>

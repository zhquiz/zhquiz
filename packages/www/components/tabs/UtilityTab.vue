<template>
  <section>
    <div class="card">
      <header class="card-header">
        <div class="card-header-title">
          <h2 class="title is-4">Sentence tokenization</h2>
        </div>
      </header>

      <div class="card-content">
        <b-field label="Text to tokenize">
          <b-input type="textarea" v-model="q"></b-input>
        </b-field>

        <div style="display: flex; flex-direction: row">
          <b-button @click="doSegment(q)" type="is-success">Submit</b-button>
          <b-checkbox class="ml-4" v-model="isRaw">
            One item per line
          </b-checkbox>
        </div>

        <div class="mt-4 content">
          <ul class="mt-4">
            <li class="segment" v-for="(t, i) in segments" :key="i">
              <span
                class="has-context"
                @click="
                  (evt) => {
                    selected = t.entry
                    $refs.context.open(evt)
                  }
                "
                @contextmenu.prevent="
                  (evt) => {
                    selected = t.entry
                    $refs.context.open(evt)
                  }
                "
              >
                {{ t.entry }}
              </span>
              <span
                class="has-context"
                v-for="(a, j) in t.alt"
                :key="j"
                @click="
                  (evt) => {
                    selected = a
                    $refs.context.open(evt)
                  }
                "
                @contextmenu.prevent="
                  (evt) => {
                    selected = a
                    $refs.context.open(evt)
                  }
                "
              >
                {{ a }}
              </span>
              <span v-if="t.reading.length">
                [{{ t.reading.join(' | ') }}]
              </span>
              <span>
                {{ t.english.join(' / ') }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <ContextMenu ref="context" :entry="selected" type="vocabulary" />
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import ContextMenu from '../ContextMenu.vue'

ContextMenu
@Component<UtilityTab>({
  components: {
    ContextMenu,
  },
  created() {
    this.$emit('title', 'Utility')
  },
})
export default class UtilityTab extends Vue {
  q = ''
  isRaw = false

  selected = ''
  segments: {
    entry: string
    alt: string[]
    reading: string[]
    english: string[]
  }[] = []

  async doSegment(q: string) {
    if (this.isRaw) {
      this.segments = await this.$axios
        .vocabularyGetByEntries({
          entries: q
            .trim()
            .split('\n')
            .filter((a, i, r) => r.indexOf(a) === i),
        })
        .then((r) => r.data.result)
    } else {
      this.segments = await this.$axios
        .sentenceVocabulary({ q })
        .then((r) => r.data.result)
    }
  }
}
</script>


<style lang="scss" scoped>
.has-context {
  cursor: pointer;

  &:hover {
    color: blue;
  }
}

li > span {
  & + & {
    margin-left: 1em;
  }
}
</style>
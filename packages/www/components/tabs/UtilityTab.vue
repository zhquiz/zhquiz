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

        <div class="mt-4">
          <LibraryCard
            type="vocabulary"
            :entries="segments"
            :open="!!segments.length"
            title="Result"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import LibraryCard from '../cards/LibraryCard.vue'

LibraryCard
@Component<UtilityTab>({
  components: {
    LibraryCard,
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
  }[] = []

  async doSegment(q: string) {
    if (this.isRaw) {
      this.segments = q
        .trim()
        .split('\n')
        .filter((a) => /\p{sc=Han}/u.test(a))
        .map((entry) => entry.trim())
        .filter((a, i, r) => r.indexOf(a) === i)
        .map((entry) => ({ entry }))
    } else {
      this.segments = await this.$axios
        .tokenize({ q })
        .then((r) => r.data.result.map((entry) => ({ entry })))
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
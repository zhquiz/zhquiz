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
          <b-checkbox class="ml-4" v-model="isRaw">Raw</b-checkbox>
        </div>

        <b-taglist class="mt-4">
          <b-tag
            size="is-large"
            type="is-light is-info"
            class="segment"
            v-for="(t, i) in segments"
            :key="i"
            @click="
              (evt) => {
                selected = t
                $refs.context.open(evt)
              }
            "
            @contextmenu.prevent="
              (evt) => {
                selected = t
                $refs.context.open(evt)
              }
            "
          >
            {{ t }}
          </b-tag>
        </b-taglist>
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
  segments: string[] = []

  async doSegment(q: string) {
    if (this.isRaw) {
      this.segments = [q]
    } else {
      this.segments = await this.$axios
        .tokenize({ q })
        .then((r) => r.data.result)
    }
  }
}
</script>


<style lang="scss" scoped>
.segment {
  cursor: pointer;

  &:hover {
    color: blue;
  }
}
</style>
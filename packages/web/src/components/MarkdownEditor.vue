<template lang="pug">
.columns(style="display: relative;")
  button.button(style="position: absolute; right: 0; top: 0; z-index: 1000;" @click="isPreview = !isPreview")
    b-tooltip(:label="isPreview ? 'Hide preview' : 'Show preview'")
      fontawesome(icon="eye-slash" v-if="isPreview")
      fontawesome(icon="eye" v-else)
  .column(:class="isPreview ? 'is-6' : ''")
    codemirror(v-model="markdown" @input="onCodeChange" ref="cm")
  .column(:class="isPreview ? 'is-6' : 'is-hidden'")
    .content(v-html="html")
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop } from 'vue-property-decorator'
import CodeMirror from 'codemirror'

@Component
export default class MarkdownEditor extends Vue {
  @Prop({ default: '' }) value!: string
  @Prop({ required: true }) renderer!: (s: string) => string

  markdown = this.value
  readonly mq = matchMedia('(min-width: 770px)')

  isPreview = this.mq.matches
  isFromExternal = false

  get codemirror () {
    const cm = this.$refs.cm as any
    return cm.codemirror as CodeMirror.Editor
  }

  get html () {
    return this.renderer(this.markdown)
  }

  created () {
    this.mq.addListener(this.mqListener)
  }

  beforeDestroy () {
    this.mq.removeListener(this.mqListener)
  }

  mqListener (ev: MediaQueryListEvent) {
    this.isPreview = ev.matches
  }

  onCodeChange () {
    if (!this.isFromExternal) {
      this.$emit('input', this.markdown)
    }
  }

  @Watch('value')
  onValueChange () {
    this.isFromExternal = true
    this.codemirror.setValue(this.value)
    this.isFromExternal = false
  }
}
</script>

<style lang="scss">
.vue-codemirror {
  border: 1px solid rgb(216, 216, 216);
}
</style>

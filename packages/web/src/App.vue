<template lang="pug">
#App
  b-loading(active v-if="isLoading")
  component(v-else-if="layout" :is="layout")
    router-view
  router-view(v-else)
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'

@Component
export default class App extends Vue {
  isLoading = true

  get user () {
    return this.$store.state.user
  }

  get layout () {
    const layout = this.$route.meta.layout
    return layout ? `${layout}-layout` : null
  }

  created () {
    this.onUserChange()
  }

  @Watch('user')
  onUserChange () {
    if (!this.user) {
      setTimeout(() => {
        this.isLoading = false
      }, 3000)
    } else {
      this.isLoading = false
    }
    this.onLoadingChange()
  }

  @Watch('isLoading')
  onLoadingChange () {
    if (!this.isLoading) {
      if (!this.user) {
        this.$router.push('/')
      } else if (this.$route.path === '/') {
        this.$router.push('/random')
      }
    }
  }
}
</script>

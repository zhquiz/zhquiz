<template lang="pug">
  v-app
    v-navigation-drawer(v-model="isDrawer" app :expand-on-hover="!isTabletAndDown")
      v-list(dense="")
        v-list-item(to="/")
          v-list-item-avatar
            v-icon mdi-home
          v-list-item-content
            v-list-item-title Home
        v-list-item(to="/hanzi")
          v-list-item-avatar
            span 字
          v-list-item-content
            v-list-item-title Hanzi
        v-list-item(to="/vocab")
          v-list-item-avatar
            span 词
          v-list-item-content
            v-list-item-title Vocab
        v-list-item(to="/sentence")
          v-list-item-avatar
            span 文
          v-list-item-content
            v-list-item-title Sentence
        v-list-item(href="https://github.com/patarapolw/zhview" target="_blank")
          v-list-item-avatar
            v-icon mdi-github-circle
          v-list-item-content
            v-list-item-title About
    v-app-bar(app dark color="green" v-if="isTabletAndDown")
      v-app-bar-nav-icon(@click.stop="isDrawer = !isDrawer")
      v-toolbar-title 中文 View
    v-content(fluid fill-height)
      router-view
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class App extends Vue {
  private isDrawer: boolean = !this.$vuetify.breakpoint.mdAndDown;

  get isTabletAndDown() {
    return this.$vuetify.breakpoint.mdAndDown;
  }
}
</script>

<style lang="scss">
.large {
  font-size: 50px;
}
</style>


<template lang="pug">
  v-app
    v-navigation-drawer(v-model="drawer" app="" expand-on-hover="")
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
        v-list-item
          v-list-item-avatar
            v-icon mdi-github-circle
          v-list-item-content
            v-list-item-title About
    v-content(fluid fill-height)
      router-view
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class App extends Vue {
  private drawer: boolean = true;
}
</script>

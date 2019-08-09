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
        v-list-item(@click="isHelpActivated = true")
          v-list-item-avatar
            v-icon mdi-help-circle-outline
          v-list-item-content
            v-list-item-title Help
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
    v-dialog(v-model="isHelpActivated" max-width="1000")
      v-card
        v-card-title Keyboard Shortcuts
        v-layout(row)
          v-flex(md6 xs12)
            v-list
              v-list-item
                v-list-item-avatar
                  span h
                v-list-item-content
                  v-list-item-subtitle Open help dialog
              v-list-item
                v-list-item-avatar
                  span ESC
                v-list-item-content
                  v-list-item-subtitle Close help dialog
              v-list-item
                v-list-item-avatar
                  span Left
                v-list-item-content
                  v-list-item-subtitle Navigate to previous item
              v-list-item
                v-list-item-avatar
                  span Right
                v-list-item-content
                  v-list-item-subtitle Navigate to next item
          v-flex(md6 xs12)
            v-list
              v-list-item
                v-list-item-avatar
                  span r
                v-list-item-content
                  v-list-item-subtitle Randomize
              v-list-item
                v-list-item-avatar
                  span s
                v-list-item-content
                  v-list-item-subtitle Speak
              v-list-item
                v-list-item-avatar
                  span 0-9
                v-list-item-content
                  v-list-item-subtitle Speak item 1-10, respectively
              v-list-item
                v-list-item-avatar
                  span &#96;
                v-list-item-content
                  v-list-item-subtitle Speak item 1 (Backtick)
              v-list-item
                v-list-item-avatar
                  span x
                v-list-item-content
                  v-list-item-subtitle Open in external website
        v-card-title Search filters
          v-list-item
            v-list-item-content
              v-list-item-title
                .search-heading Hanzi 
                | entry, pinyin, english, sub, sup, var,&nbsp;
                a(href="https://hanzilevelproject.blogspot.com" target="_blank") level
                | , count, percentile
              v-list-item-title
                .search-heading Vocab 
                | simplified, traditional, pinyin, english, frequency, tag (e.g. HSK1)
              v-list-item-title
                .search-heading Sentence 
                | chinese, english, percentile,&nbsp;
                a(href="https://hanzilevelproject.blogspot.com" target="_blank") level
          v-list-item
            v-list-item-content
              v-list-item-title 
                .search-heading Allowed operators 
                | : (colon), &lt;, &gt;, " (double quote), YAML, JSON, sortBy:random
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class App extends Vue {
  private isDrawer: boolean = !this.$vuetify.breakpoint.mdAndDown;
  private isHelpActivated = false;

  get isTabletAndDown() {
    return this.$vuetify.breakpoint.mdAndDown;
  }

  public mounted() {
    window.addEventListener("keydown", this.hotkeysHandler);
  }

  public beforeDestroyed() {
    window.removeEventListener("keydown", this.hotkeysHandler);
  }

  private hotkeysHandler(evt: KeyboardEvent) {
    const { target, code } = evt;

    if (target && (target as any).tagName.toLocaleUpperCase() === "INPUT") {
      return;
    }

    switch (code) {
      case "KeyH":
        this.isHelpActivated = true;
        break;
      case "Escape":
        this.isHelpActivated = false;
        break;
    }
  }
}
</script>

<style lang="scss">
.search-heading {
  display: inline-block;
  width: 10em;
  font-weight: bold;
}

@font-face {
  font-family: HanaMin;
  src: url(/fonts/HanaMinA.ttf), url(/fonts/HanaMinB.ttf);
}
</style>


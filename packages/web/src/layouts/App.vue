<template lang="pug">
main#App(:style="{ 'flex-direction': $mq === 'desktop' ? 'row' : 'column'}")
  nav.vertical-nav(v-if="$mq === 'desktop'")
    nav.icon-nav(style="margin-top: 1em;")
      router-link.nav-link(to="/random" :class="{ active: $route.path === '/random' }")
        fontawesome(icon="random")
        span Random
      router-link.nav-link(to="/quiz" :class="{ active: $route.path === '/quiz' }")
        fontawesome(icon="question-circle")
        span Quiz
      router-link.nav-link(to="/hanzi" :class="{ active: $route.path === '/hanzi' }")
        span.icon.font-hanzi 字
        span Hanzi
      router-link.nav-link(to="/vocab" :class="{ active: $route.path === '/vocab' }")
        span.icon.font-hanzi 词
        span Vocab
      router-link.nav-link(to="/level" :class="{ active: $route.path === '/level' }")
        span.icon 60
        span Level
      router-link.nav-link(to="/extra" :class="{ active: $route.path === '/extra' }")
        fontawesome(icon="folder-plus")
        span Extra
      router-link.nav-link(to="/settings" :class="{ active: $route.path === '/settings' }")
        fontawesome(icon="cog")
        span Settings
      a.nav-link(href="https://github.com/patarapolw/zhquiz" target="_blank" rel="noopener")
        fontawesome(:icon="['fab', 'github']")
        span About
    div(style="flex-grow: 1;")
    nav.icon-nav(style="margin-bottom: 0.5em;")
      b-tooltip(label="Click to logout")
        a.nav-link(v-if="user" @click="doLogout")
          figure.image.is-48x48(style="margin-left: 0.5em; margin-right: 1em;")
            img.is-rounded(:src="getGravatarUrl(user.email)" :alt="user.email")
          span {{user.email}}
  b-navbar.main-navbar.has-shadow.is-warning(v-else)
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        strong Zh
        span Quiz
    template(slot="start")
      b-navbar-item(tag="router-link" to="/random" :active="$route.path === '/random'") Random
      b-navbar-item(tag="router-link" to="/quiz" :active="$route.path === '/quiz'") Quiz
      b-navbar-item(tag="router-link" to="/hanzi" :active="$route.path === '/hanzi'") Hanzi
      b-navbar-item(tag="router-link" to="/vocab" :active="$route.path === '/vocab'") Vocab
      b-navbar-item(tag="router-link" to="/level" :active="$route.path === '/level'") Level
      b-navbar-item(tag="router-link" to="/extra" :active="$route.path === '/extra'") Extra
      b-navbar-item(tag="router-link" to="/settings" :active="$route.path === '/settings'") Settings
      b-navbar-item(href="https://github.com/patarapolw/zhquiz" target="_blank" rel="noopener") About
    template(slot="end")
      b-navbar-item(tag="div" v-if="user") Signed in as {{user.email}}
      b-navbar-item(tag="div")
        b-button(v-if="user" type="is-danger" @click="doLogout") Logout
  article
    slot
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase from 'firebase/app'
import SparkMD5 from 'spark-md5'

import 'firebase/auth'

@Component
export default class App extends Vue {
  get user () {
    return this.$store.state.user
  }

  doLogout () {
    firebase.auth().signOut()
  }

  getGravatarUrl (email: string) {
    return `https://www.gravatar.com/avatar/${SparkMD5.hash(email.trim().toLocaleLowerCase())}?d=mp`
  }
}
</script>

<style lang="scss" scoped>
.main-navbar {
  background-image: radial-gradient(circle at center right, rgb(255, 233, 162),rgb(255, 220, 106));
}

#App {
  display: flex;
  width: 100vw;
  height: 100vh;

  > .vertical-nav {
    overflow: visible;
    z-index: 10;
    display: flex;
    flex-direction: column;
    width: 300px;
    background-image: radial-gradient(circle at center right, rgb(255, 233, 162),rgb(255, 220, 106));

    nav {
      display: flex;
      flex-direction: column;
    }

    .svg-inline--fa, .icon {
      $size: 30px;
      font-size: 20px;
      font-weight: 600;

      width: $size;
      height: $size;
      margin: 10px;
      align-self: center;
    }

    .nav-link {
      display: flex;
      flex-direction: row;
      align-items: center;

      &.active {
        background-color: rgba(238, 238, 238, 0.295);
      }
    }
  }

  > article {
    overflow: scroll;
    flex-grow: 1;
    padding: 1em;
    background-color: rgb(250, 250, 250);
  }
}
</style>

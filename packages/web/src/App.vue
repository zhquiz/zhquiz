<template lang="pug">
main
  b-navbar.has-shadow.is-warning(style="margin-bottom: 1em;")
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        strong Zh
        span View
    template(slot="start")
      b-navbar-item(tag="router-link" to="/hanzi" :active="$route.path === '/hanzi'") Hanzi
      b-navbar-item(tag="router-link" to="/vocab" :active="$route.path === '/vocab'") Vocab
      b-navbar-item(tag="router-link" to="/lesson" :active="$route.path === '/lesson'") Lesson
      b-navbar-item(tag="router-link" to="/level" :active="$route.path === '/level'") Level
      b-navbar-item(tag="router-link" to="/settings" :active="$route.path === '/settings'") Settings
      b-navbar-item(href="https://github.com/patarapolw/zhview" target="_blank" rel="noopener") About
    template(slot="end")
      b-navbar-item(tag="div" v-if="user") Signed in as {{user.email}}
      b-navbar-item(tag="div")
        b-button(v-if="user" type="is-danger" @click="doLogout") Logout
        b-button(v-else type="is-primary" @click="isLoginModal = true") Login
  router-view
  b-modal(:active.sync="isLoginModal" :can-cancel="false" style="z-index: 2000;")
    div(ref="auth")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase from 'firebase/app'
import { auth as authUI } from 'firebaseui'

import 'firebase/auth'
import 'firebaseui/dist/firebaseui.css'

let firebaseUI: authUI.AuthUI | null

@Component
export default class App extends Vue {
  isLoginModal = false

  get user () {
    return this.$store.state.user
  }

  get isAuthenticated () {
    return this.$store.state.lastStatus !== 401
  }

  created () {
    this.onUserChange()
  }

  @Watch('user')
  onUserChange () {
    if (!this.user) {
      setTimeout(() => {
        this.isLoginModal = !this.user
      }, 2000)
    } else {
      this.isLoginModal = false
    }
  }

  @Watch('isLoginModal')
  onLogin () {
    this.$nextTick(() => {
      if (this.$refs.auth) {
        if (!firebaseUI) {
          firebaseUI = new authUI.AuthUI(firebase.auth())
        }

        firebaseUI.start(this.$refs.auth as HTMLDivElement, {
          signInSuccessUrl: this.$router.resolve('/').href,
          signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
          ],
          signInFlow: 'popup'
        })
      }
    })
  }

  @Watch('isAuthenticated')
  onLogout () {
    if (!this.isAuthenticated) {
      this.isLoginModal = true
    }
  }

  doLogout () {
    firebase.auth().signOut()
  }
}
</script>

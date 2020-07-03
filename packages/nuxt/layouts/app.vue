<template>
  <section class="AppLayout">
    <b-loading v-if="!isReady" active />

    <nav v-if="isReady" class="vertical-nav">
      <div class="icon-nav">
        <nuxt-link to="/random" :class="{ active: $route.path === '/random' }">
          <fontawesome icon="random" />
          <span>Random</span>
        </nuxt-link>
        <nuxt-link to="/quiz" :class="{ active: $route.path === '/quiz' }">
          <fontawesome icon="question-circle" />
          <span>Quiz</span>
        </nuxt-link>
        <nuxt-link to="/hanzi" :class="{ active: $route.path === '/hanzi' }">
          <span class="icon font-hanzi">字</span>
          <span>Hanzi</span>
        </nuxt-link>
        <nuxt-link to="/vocab" :class="{ active: $route.path === '/vocab' }">
          <span class="icon font-hanzi">词</span>
          <span>Vocab</span>
        </nuxt-link>
        <nuxt-link to="/level" :class="{ active: $route.path === '/level' }">
          <span class="icon">60</span>
          <span>Level</span>
        </nuxt-link>
        <nuxt-link to="/extra" :class="{ active: $route.path === '/extra' }">
          <fontawesome icon="folder-plus" />
          <span>Extra</span>
        </nuxt-link>
        <nuxt-link
          to="/settings"
          :class="{ active: $route.path === '/settings' }"
        >
          <fontawesome icon="cog" />
          <span>Settings</span>
        </nuxt-link>
        <a
          href="https://github.com/patarapolw/zhquiz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <fontawesome :icon="['fab', 'github']" />
          <span>About</span>
        </a>
      </div>

      <div class="flex-grow" />

      <div class="icon-nav">
        <b-tooltip label="Click to logout">
          <a @click="doLogout" @keypress="doLogout">
            <figure class="image is-48x48">
              <img
                class="is-rounded"
                :src="getGravatarUrl(user.email)"
                :alt="user.email"
              />
            </figure>
            <span>{{ user.email }}</span>
          </a>
        </b-tooltip>
      </div>
    </nav>

    <b-navbar v-if="isReady" class="main-nav has-shadow is-warning">
      <template slot="brand">
        <b-navbar-item tag="router-link" to="/">
          <strong>Zh</strong>
          <span>Quiz</span>
        </b-navbar-item>
      </template>
      <template slot="start">
        <b-navbar-item
          tag="router-link"
          to="/random"
          :active="$route.path === '/random'"
        >
          Random
        </b-navbar-item>
        <b-navbar-item
          tag="router-link"
          to="/quiz"
          :active="$route.path === '/quiz'"
        >
          Quiz
        </b-navbar-item>
        <b-navbar-item
          tag="router-link"
          to="/hanzi"
          :active="$route.path === '/hanzi'"
        >
          Hanzi
        </b-navbar-item>
        <b-navbar-item
          tag="router-link"
          to="/vocab"
          :active="$route.path === '/vocab'"
        >
          Vocab
        </b-navbar-item>
        <b-navbar-item
          tag="router-link"
          to="/level"
          :active="$route.path === '/level'"
        >
          Level
        </b-navbar-item>
        <b-navbar-item
          tag="router-link"
          to="/extra"
          :active="$route.path === '/extra'"
        >
          Extra
        </b-navbar-item>
        <b-navbar-item
          tag="router-link"
          to="/settings"
          :active="$route.path === '/settings'"
        >
          Settings
        </b-navbar-item>
        <b-navbar-item
          tag="a"
          href="https://github.com/patarapolw/zhquiz"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </b-navbar-item>
      </template>
      <template slot="end">
        <b-navbar-item tag="div"> Signed in as {{ user.email }} </b-navbar-item>
        <b-navbar-item tag="div">
          <button
            class="button is-danger"
            @click="doLogout"
            @keypress="doLogout"
          >
            Logout
          </button>
        </b-navbar-item>
      </template>
    </b-navbar>

    <main v-if="isReady">
      <nuxt />
    </main>
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'nuxt-property-decorator'

import { getGravatarUrl } from '~/assets/gravatar'

@Component
export default class AppLayout extends Vue {
  getGravatarUrl = getGravatarUrl

  get isReady() {
    return this.isAuthReady && this.user
  }

  get isAuthReady() {
    return this.$store.state.isAuthReady
  }

  get user() {
    return this.$store.state.user
  }

  doLogout() {
    this.$fireAuth.signOut()
  }

  @Watch('isAuthReady')
  @Watch('user')
  onAuthChanged() {
    if (this.isAuthReady && !this.user) {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.AppLayout {
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
}

.vertical-nav {
  display: none;
  overflow: visible;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: 300px;
  background-image: radial-gradient(
    circle at center right,
    rgb(255, 233, 162),
    rgb(255, 220, 106)
  );
}

.vertical-nav .svg-inline--fa,
.vertical-nav .icon {
  --icon-size: 30px;

  font-size: 20px;
  font-weight: 600;
  width: var(--icon-size);
  height: var(--icon-size);
  margin: 10px;
  align-self: center;
}

.icon-nav {
  display: flex;
  flex-direction: column;
}

.icon-nav:first-child {
  margin-top: 1rem;
}

.icon-nav:last-child {
  margin-bottom: 0.5rem;
}

.icon-nav a {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.icon-nav a:active {
  background-color: rgba(238, 238, 238, 0.295);
}

.icon-nav:last-child figure {
  margin-left: 0.5rem;
  margin-right: 1rem;
}

.main-nav {
  display: flex;
  background-image: radial-gradient(
    circle at center right,
    rgb(255, 233, 162),
    rgb(255, 220, 106)
  );
}

main {
  overflow: scroll;
  flex-grow: 1;
  padding: 1rem;
  background-color: rgb(250, 250, 250);
}

@media (min-width: 1025px) {
  .AppLayout {
    flex-direction: row;
  }

  .vertical-nav {
    display: flex;
  }

  .main-nav {
    display: none;
  }
}
</style>

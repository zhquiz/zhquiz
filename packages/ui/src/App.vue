<template>
  <section class="AppLayout">
    <nav class="vertical-nav">
      <div class="icon-nav" style="overflow-y: scroll">
        <component
          :is="nav.to ? 'router-link' : 'a'"
          v-for="nav in navItems"
          :key="nav.name"
          :to="nav.to"
          :class="{ active: $route.path === nav.to }"
          @click="nav.href ? openInNewTab(nav.href) : undefined"
        >
          <fontawesome v-if="nav.icon" :icon="nav.icon" />
          <span
            v-if="nav.character || nav.text"
            class="icon"
            :class="{ 'font-han': nav.character }"
          >
            {{ nav.character || nav.text }}
          </span>
          <span>{{ nav.name }}</span>
        </component>
      </div>
    </nav>

    <b-navbar class="main-nav has-shadow is-warning">
      <template slot="brand">
        <b-navbar-item tag="router-link" to="/">
          <strong>Zh</strong>
          <span>Quiz</span>
        </b-navbar-item>
      </template>
      <template slot="start">
        <b-navbar-item
          v-for="nav in navItems"
          :key="nav.name"
          :tag="nav.to ? 'router-link' : 'a'"
          :to="nav.to"
          :active="$route.path === nav.to"
          @click="nav.href ? openInNewTab(nav.href) : undefined"
        >
          <span class="prefix">
            <fontawesome v-if="nav.icon" :icon="nav.icon" />
            <span
              v-if="nav.character || nav.text"
              class="icon"
              :class="{ 'font-zh-simp': nav.character }"
            >
              {{ nav.character || nav.text }}
            </span>
          </span>
          <span>{{ nav.name }}</span>
        </b-navbar-item>
      </template>
    </b-navbar>

    <router-view class="main" />
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component<AppLayout>({
  created () {
    this.$accessor.updateSettings()
  }
})
export default class AppLayout extends Vue {
  get navItems () {
    return [
      {
        name: 'Random',
        to: '/random',
        icon: 'random'
      },
      {
        name: 'Quiz',
        to: '/quiz',
        icon: 'chalkboard-teacher'
      },
      {
        name: 'Hanzi',
        to: '/hanzi',
        character: '字'
      },
      {
        name: 'Vocab',
        to: '/vocab',
        character: '词'
      },
      {
        name: 'Sentence',
        to: '/sentence',
        character: '句'
      },
      {
        name: 'Extra',
        to: '/extra',
        icon: 'user-edit'
      },
      {
        name: 'Library',
        to: '/library',
        icon: 'book-reader'
      },
      {
        name: 'Level',
        to: '/level',
        text: this.level
      },
      {
        name: 'Settings',
        to: '/settings',
        icon: 'cog'
      },
      {
        name: 'About',
        href: 'https://github.com/zhquiz/go-zhquiz',
        icon: ['fab', 'github']
      }
    ]
  }

  openInNewTab = window.parent
    ? (url: string, title?: string) => {
      window.parent.open(url, title)
    }
    : (url: string) => {
      open(url, '_blank', 'noopener noreferrer')
    }

  get level () {
    const { level } = this.$store.state.settings
    return level ? level.toString() : ' '
  }
}
</script>

<style lang="scss" scoped>
.AppLayout {
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
}

.vertical-nav {
  display: grid;
  grid-template-rows: 1fr 4rem;

  overflow: scroll;
  z-index: 10;
  width: 300px;
  min-width: 300px;
  max-height: 100vh;
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

.vertical-nav,
.icon-nav {
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */

  &::-webkit-scrollbar {
    width: 0px; /* For Chrome, Safari, and Opera */
  }
}

.icon-nav {
  display: flex;
  flex-direction: column;
}

.icon-nav:first-child {
  padding-top: 1rem;
}

.icon-nav a {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.icon-nav a.active {
  background-color: rgba(255, 255, 0, 0.5);
}

.icon-nav:last-child figure {
  margin-left: 0.5rem;
  margin-right: 1rem;
}

.b-tooltip {
  width: 100%;
  height: 100%;
}

.login-banner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;

  background-color: rgba(90, 90, 90, 0.2);
}

.main-nav {
  z-index: 20;
  display: flex;
  background-image: radial-gradient(
    circle at center right,
    rgb(255, 233, 162),
    rgb(255, 220, 106)
  );
}

.main-nav >>> .navbar-start:not(.is-active) :not(button) {
  background-color: white;
}

.main-nav >>> .prefix {
  width: 2em;
  display: inline-block;
}

.main {
  max-height: 100vh;
  overflow: scroll;
  flex-grow: 1;
  padding: 1rem;
  background-color: rgb(250, 250, 250);

  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */

  &::-webkit-scrollbar {
    width: 0px; /* For Chrome, Safari, and Opera */
  }
}

@media screen and (max-width: 800px) {
  .AppLayout {
    flex-direction: column;
  }

  .vertical-nav {
    display: none;
  }

  .main-nav {
    display: flex;
    flex-direction: column;
  }
}

@media (min-width: 801px) {
  .AppLayout {
    flex-direction: row;
  }

  .main-nav {
    display: none;
  }
}
</style>

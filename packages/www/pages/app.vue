<template>
  <section class="AppPage">
    <b-loading v-if="!isReady" active is-full-page></b-loading>

    <b-sidebar v-if="isReady" v-model="isDrawer" type="is-light" fullheight>
      <div class="p-2">
        <aside class="menu">
          <p class="menu-label">Menu</p>

          <ul class="menu-list">
            <li v-for="(n, j) in navItems" :key="j">
              <a
                role="button"
                :class="{
                  'is-active': tabs[activeTab].component === n.component,
                }"
                @click="setTab(activeTab, n.component)"
              >
                <b-icon v-if="n.icon" :icon="n.icon"></b-icon>
                <span v-if="n.text" :class="'icon ' + n.className">
                  {{ n.text }}
                </span>
                {{ n.component }}
              </a>
            </li>

            <li>
              <a
                href="https://github.com/zhquiz/zhquiz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <b-icon pack="fab" icon="github"></b-icon>
                About
              </a>
            </li>
          </ul>
        </aside>
      </div>

      <div style="flex-grow: 1"></div>

      <div class="p-4">
        <center>Logged in as DEFAULT</center>
      </div>
    </b-sidebar>

    <nav v-if="isReady" class="tabs is-toggle">
      <ul>
        <li @click="isDrawer = true">
          <b-icon class="clickable" icon="bars" role="button"></b-icon>
        </li>
        <li
          v-for="(t, i) in tabs"
          :key="i"
          :class="{ 'is-active': activeTab === i }"
        >
          <a role="button">
            <b-dropdown aria-role="menu" append-to-body :value="t.component">
              <template #trigger>
                <a class="no-margin" role="button">
                  <span @click.stop="activeTab = i">
                    {{ t.title }}
                  </span>
                  <b-icon icon="caret-down"></b-icon>
                </a>
              </template>

              <b-dropdown-item
                v-for="(n, j) in navItems"
                :key="j"
                :value="n.component"
                aria-role="menuitem"
                @click="setTab(i, n.component)"
              >
                <b-icon v-if="n.icon" :icon="n.icon"></b-icon>
                <span v-if="n.text" :class="'icon ' + n.className">
                  {{ n.text }}
                </span>
                {{ n.component }}
              </b-dropdown-item>
            </b-dropdown>

            <button
              v-if="!t.permanent"
              class="delete is-small"
              @click="deleteTab(i)"
            ></button>
          </a>
        </li>

        <li>
          <a role="button" @click="addTab('Random')">+</a>
        </li>
      </ul>
    </nav>

    <main v-if="isReady">
      <component
        :is="t.component + 'Tab'"
        v-for="(t, i) in tabs"
        v-show="activeTab === i"
        :key="i"
        @title="(t) => setTitle(i, t)"
      />
    </main>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component<AppPage>({
  components: {
    BrowseTab: () => import('@/components/tabs/BrowseTab.vue'),
    CharacterTab: () => import('@/components/tabs/CharacterTab.vue'),
    LevelTab: () => import('@/components/tabs/LevelTab.vue'),
    LibraryTab: () => import('@/components/tabs/LibraryTab.vue'),
    QuizTab: () => import('@/components/tabs/QuizTab.vue'),
    RandomTab: () => import('@/components/tabs/RandomTab.vue'),
    SettingsTab: () => import('@/components/tabs/SettingsTab.vue'),
    VocabularyTab: () => import('@/components/tabs/VocabularyTab.vue'),
  },
  async mounted() {
    await this.$accessor.setCredentials()

    if (!this.$accessor.isApp) {
      this.$router.replace('/')
    } else {
      this.addTab('Random', true)
      this.isReady = true
    }
  },
})
export default class AppPage extends Vue {
  isReady = false

  tabs: {
    title: string
    component: string
    permanent?: boolean
  }[] = []

  activeTab = 0

  isDrawer = false

  get navItems(): {
    component: string
    icon?: string | string[]
    text?: string
    className?: string
  }[] {
    return [
      {
        component: 'Random',
        icon: 'random',
      },
      {
        component: 'Quiz',
        icon: 'chalkboard-teacher',
      },
      {
        component: 'Hanzi',
        text: '字',
        className: 'font-han',
      },
      {
        component: 'Vocab',
        text: '词',
        className: 'font-han',
      },
      {
        component: 'Level',
        text: this.level,
      },
      {
        component: 'Browse',
        icon: 'list-ol',
      },
      {
        component: 'Library',
        icon: 'book-reader',
      },
      {
        component: 'Settings',
        icon: 'cog',
      },
    ]
  }

  setTitle(i: number, t: string) {
    const tabs = this.clone(this.tabs)
    tabs[i].title = t

    this.tabs = tabs
  }

  addTab(component: string, permanent?: boolean) {
    this.tabs = [
      ...this.tabs,
      {
        title: component,
        component,
        permanent,
      },
    ]
    this.activeTab = this.tabs.length - 1
  }

  setTab(i: number, component: string) {
    const tabs = this.clone(this.tabs)
    tabs[i].component = component

    this.tabs = tabs
    this.activeTab = i
  }

  deleteTab(i: number) {
    const tabs = this.clone(this.tabs)
    tabs.splice(i, 1)

    if (this.activeTab >= tabs.length) {
      this.activeTab = tabs.length - 1
    }

    this.tabs = tabs
  }

  clone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o))
  }

  get level() {
    const { level } = this.$store.state.settings
    return level ? level.toString() : ' '
  }
}
</script>

<style lang="scss" scoped>
.AppPage {
  height: 100%;
}

nav.tabs {
  padding-top: 0.5em;
  padding-left: 0.5em;
  margin-bottom: 0 !important;
  background-color: rgba(211, 211, 211, 0.3);

  li:not(.is-active) a {
    background-color: lightgray;
  }

  li + li {
    margin-left: 0.5em !important;
  }

  li a {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;

    .no-margin {
      padding: 0;
    }
  }

  & :hover {
    border: none;
  }
}

main {
  border: 0;
  width: 100%;
  max-width: 100vw;
  height: 100%;
}

.delete {
  border: none !important;
  transform: translateX(50%);
  background-color: rgba(143, 183, 221, 0.61) !important;

  &:hover {
    background-color: lightgray !important;
  }
}

.clickable {
  cursor: pointer;

  &:hover {
    color: blue;
  }
}

.loading {
  color: lightgray;

  > span {
    $n: 3;
    $speed: 0.1s;

    position: relative;
    animation: loading (($n + 1) * $speed) infinite;

    @for $i from 1 through $n {
      &:nth-child(#{$i}) {
        animation-delay: $i * $speed;
      }
    }
  }

  @keyframes loading {
    0% {
      color: inherit;
    }

    40% {
      color: gray;
    }

    100% {
      color: inherit;
    }
  }
}
</style>

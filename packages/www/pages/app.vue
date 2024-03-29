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
                {{ n.title || n.component }}
              </a>
            </li>

            <li>
              <a
                href="https://github.com/zhquiz/zhquiz/discussions"
                target="_blank"
                rel="noopener noreferrer"
              >
                <b-icon pack="fab" icon="github"></b-icon>
                {{ 'Support & Contribute' }}
              </a>
            </li>
          </ul>
        </aside>
      </div>

      <div style="flex-grow: 1"></div>

      <div class="p-4">
        <center>
          <a role="button" title="Click to logout" @click="doLogout">
            Logged in as {{ $store.state.identifier }}
          </a>
        </center>
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
                  <span class="text" @click.stop="setCurrentTab(i)">
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
                {{ n.title || n.component }}
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
        class="container"
        :is="t.component + 'Tab'"
        v-for="(t, i) in tabs"
        v-show="activeTab === i"
        :key="i"
        :query="t.query"
        @title="(t) => setTitle(i, t)"
      />
    </main>
  </section>
</template>

<script lang="ts">
import BrowseTab from '@/components/tabs/BrowseTab.vue'
import CharacterTab from '@/components/tabs/CharacterTab.vue'
import LevelTab from '@/components/tabs/LevelTab.vue'
import LibraryTab from '@/components/tabs/LibraryTab.vue'
import QuizTab from '@/components/tabs/QuizTab.vue'
import RandomTab from '@/components/tabs/RandomTab.vue'
import SettingsTab from '@/components/tabs/SettingsTab.vue'
import VocabularyTab from '@/components/tabs/VocabularyTab.vue'
import UtilityTab from '@/components/tabs/UtilityTab.vue'
import { Component, Vue } from 'nuxt-property-decorator'

@Component<AppPage>({
  components: {
    BrowseTab,
    CharacterTab,
    LevelTab,
    LibraryTab,
    QuizTab,
    RandomTab,
    SettingsTab,
    VocabularyTab,
    UtilityTab,
  },
  async mounted() {
    await this.$accessor.setCredentials()
    await this.$accessor.updateSettings()

    if (!this.$accessor.isApp) {
      this.$router.replace('/')
    } else {
      this.$accessor.ADD_TAB({
        component: 'Random',
        first: true,
      })
      this.isReady = true
    }
  },
})
export default class AppPage extends Vue {
  isReady = false
  isDrawer = false

  get navItems(): {
    title?: string
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
        title: 'Hanzi',
        component: 'Character',
        text: '字',
        className: 'font-han',
      },
      {
        component: 'Vocabulary',
        text: '词',
        className: 'font-han',
      },
      {
        component: 'Level',
        text: this.level,
      },
      {
        title: 'User content',
        component: 'Browse',
        icon: 'list-ol',
      },
      {
        component: 'Library',
        icon: 'book-reader',
      },
      {
        component: 'Utility',
        icon: 'tools',
      },
      {
        component: 'Settings',
        icon: 'cog',
      },
    ]
  }

  get level() {
    const { level } = this.$store.state.settings
    return level ? level.toString() : ' '
  }

  get tabs() {
    return this.$store.state.tabs
  }

  get activeTab() {
    return this.$store.state.activeTab
  }

  setTab(i: number, component: string) {
    this.$accessor.SET_TAB_COMPONENT({ i, component })
  }

  setCurrentTab(i: number) {
    this.$accessor.SET_TAB_CURRENT({ i })
  }

  addTab(component: string) {
    this.$accessor.ADD_TAB({ component })
  }

  deleteTab(i: number) {
    this.$accessor.DELETE_TAB({ i })
  }

  setTitle(i: number, title: string) {
    this.$accessor.SET_TAB_TITLE({ i, title })
  }

  doLogout() {
    this.$buefy.dialog.confirm({
      message: 'Are you sure you want to logout?',
      onConfirm: async () => {
        await this.$axios.userSignOut()
        this.$router.push('/')
      },
    })
  }
}
</script>

<style lang="scss" scoped>
::v-deep .sidebar-content {
  z-index: 60;
}

.AppPage {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
}

$nav-height: 45px;

nav.tabs {
  z-index: 50;
  height: $nav-height;
  padding-top: 0.5em;
  padding-left: 0.5em;
  margin-bottom: 0 !important;
  background-color: rgba(230, 230, 230, 0.1);

  li {
    opacity: 0.7;
  }

  li:not(.is-active) a {
    background-color: rgba(211, 211, 211, 0.5);
    border: none;
  }

  li + li {
    margin-left: 0.5em !important;
  }

  li a {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;

    span.text {
      max-width: 10em;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0;
    }

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
  overflow-y: scroll;
  position: absolute;
  margin-top: $nav-height;
  padding-top: 20px;
  padding-bottom: 100px;
  height: 100%;
  background-color: rgba(211, 211, 211, 0.2);
  box-sizing: border-box;
}

.delete {
  border: none !important;
  transform: translateX(50%);
  background-color: rgba(143, 183, 221);

  &:hover {
    background-color: lightgray;
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

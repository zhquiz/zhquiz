<template>
  <section>
    <nav class="tabs is-toggle">
      <ul>
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
      </ul>
    </nav>

    <main>
      <tab-layout
        v-for="(t, i) in tabs"
        v-show="activeTab === i"
        :key="i"
        :component="t.component"
        @title="(t) => setTitle(i, t)"
      ></tab-layout>
    </main>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component<AppPage>({
  created() {
    this.addTab('Random', true)
    this.addTab('Random')
  },
})
export default class AppPage extends Vue {
  tabs: {
    title: string
    component: string
    permanent?: boolean
  }[] = []

  activeTab = 0

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
        component: 'Sentence',
        text: '句',
        className: 'font-han',
      },
      {
        component: 'Extra',
        icon: 'user-edit',
      },
      {
        component: 'Library',
        icon: 'book-reader',
      },
      {
        component: 'Level',
        text: this.level,
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

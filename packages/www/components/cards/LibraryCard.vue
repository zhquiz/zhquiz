<template>
  <section>
    <div class="card">
      <header class="card-header" style="display: flex; flex-direction: row">
        <div class="card-header-title" style="flex-grow: 1">
          <p
            class="has-context"
            @click="
              (evt) => {
                selected = currentData
                $refs.context.open(evt)
              }
            "
            @contextmenu.prevent="
              (evt) => {
                selected = currentData
                $refs.context.open(evt)
              }
            "
          >
            {{ title }}
          </p>
          <div
            @click="isOpen = !isOpen"
            style="flex-grow: 1; height: 100%; cursor: pointer"
          ></div>
        </div>
        <a
          v-if="isOpen"
          class="card-header-icon"
          role="button"
          @click="isList = !isList"
        >
          <b-icon :icon="isList ? 'th' : 'list-ul'"> </b-icon>
        </a>
        <a class="card-header-icon" role="button" @click="isOpen = !isOpen">
          <b-icon :icon="isOpen ? 'caret-down' : 'caret-up'"> </b-icon>
        </a>
      </header>

      <div
        v-if="isOpen"
        class="card-content"
        :data-mode="isList ? 'list' : 'item'"
      >
        <div v-if="isList">
          <b-table
            :data="list"
            paginated
            :per-page="perPage"
            @page-change="(p) => makeList(p)"
          >
            <b-table-column field="entry" label="Entry" v-slot="props">
              <span
                :class="
                  'tag clickable is-medium ' + getTagClass(props.row.entry)
                "
                @click.stop="
                  (evt) => {
                    selected = [props.row.entry]
                    $refs.context.open(evt)
                  }
                "
                @contextmenu.prevent="
                  (evt) => {
                    selected = [props.row.entry]
                    $refs.context.open(evt)
                  }
                "
              >
                {{ props.row.entry }}
              </span>

              <span
                v-for="t in props.row.alt || []"
                :key="t"
                :class="'tag clickable is-medium ' + getTagClass(t)"
                @click.stop="
                  (evt) => {
                    selected = [t]
                    $refs.context.open(evt)
                  }
                "
                @contextmenu.prevent="
                  (evt) => {
                    selected = [t]
                    $refs.context.open(evt)
                  }
                "
              >
                {{ t }}
              </span>
            </b-table-column>
            <b-table-column field="reading" label="Pinyin" v-slot="props">
              {{ (props.row.reading || []).join(' / ') }}
            </b-table-column>
            <b-table-column field="english" label="English" v-slot="props">
              <div
                class="no-scrollbar"
                style="max-width: 40vw; max-height: 200px"
              >
                {{ (props.row.english || []).join(' / ') }}
              </div>
            </b-table-column>

            <template slot="empty">
              <div style="position: relative; height: 120px">
                <b-loading active :is-full-page="false"></b-loading>
              </div>
            </template>
          </b-table>
        </div>

        <div v-else>
          <span
            v-for="t in currentData"
            :key="t"
            :class="'tag clickable is-medium ' + getTagClass(t)"
            @click.stop="
              (evt) => {
                selected = [t]
                $refs.context.open(evt)
              }
            "
            @contextmenu.prevent="
              (evt) => {
                selected = [t]
                $refs.context.open(evt)
              }
            "
          >
            {{ t }}
          </span>
        </div>
      </div>
    </div>

    <ContextMenu
      ref="context"
      :type="type"
      :entry="selected"
      :description="title + ' ' + description"
      :additional="additional"
      @quiz:added="(evt) => reload(evt.entries)"
      @quiz:removed="(evt) => reload(evt.entries)"
    />
  </section>
</template>

<script lang="ts">
import { Vue, Component, Ref, Prop } from 'nuxt-property-decorator'
import ContextMenu from '../ContextMenu.vue'

@Component<LibraryCard>({
  components: {
    ContextMenu,
  },
  watch: {
    open() {
      this.isOpen = this.open
    },
    entry() {
      this.isOpen = false
    },
    isList() {
      this.makeList()
    },
    isOpen() {
      this.reload(this.currentData)
    },
    entries() {
      this.isList = false
      this.list = []

      this.$nextTick(() => {
        this.isList = this.open
        this.reload(this.currentData)
      })
    },
  },
  created() {
    this.isOpen = this.open
  },
})
export default class LibraryCard extends Vue {
  @Prop() title!: string
  @Prop() entries!: {
    entry: string
    alt?: string[]
    reading?: string[]
    english?: string[]
  }[]
  @Prop() type!: 'character' | 'vocabulary' | 'sentence'
  @Prop({ default: '' }) description!: string
  @Prop({ default: false }) open!: boolean

  @Prop({ default: () => [] }) additional!: {
    name: string
    handler: () => void
  }[]

  @Ref() context!: ContextMenu

  isOpen = false
  isList = false

  list: {
    entry: string
    alt?: string[]
    reading?: string[]
    english?: string[]
  }[] = []

  perPage = 5

  selected: string[] = []
  srsLevel: {
    [entry: string]: number
  } = {}

  readonly tagClassMap = [
    (lv: number) => (lv > 2 ? 'is-success' : ''),
    (lv: number) => (lv > 0 ? 'is-warning' : ''),
    (lv: number) => (lv === 0 ? 'is-danger' : ''),
  ]

  get currentData() {
    return this.entries
      .map(({ entry }) => entry)
      .filter((a, i, arr) => arr.indexOf(a) === i)
  }

  async reload(entry: string[]) {
    if (!this.isOpen) {
      return
    }

    if (entry.length > 0) {
      const {
        data: { result = [] },
      } = await this.$axios.quizGetSrsLevel(null, {
        entry,
        type: this.type as any,
      })

      // eslint-disable-next-line array-callback-return
      entry.map((entry) => {
        delete this.srsLevel[entry]
      })

      // eslint-disable-next-line array-callback-return
      result.map(({ entry, srsLevel }) => {
        this.srsLevel[entry] = srsLevel
      })

      this.$set(this, 'srsLevel', this.srsLevel)
      this.$forceUpdate()
    }
  }

  async makeList(p = 1) {
    if (!this.list.length) {
      this.list = this.entries.map(({ entry }) => ({ entry }))
    }

    const offset = (p - 1) * this.perPage

    const seg = this.list.slice(offset, offset + this.perPage)
    if (!seg.length || seg.every((s) => s.english && s.english.length)) {
      return
    }

    const entries = seg.map(({ entry }) => entry)
    let newItems: string[] = []

    await this.$axios
      .libraryGetByEntries(null, {
        type: this.type,
        entries,
      })
      .then((r) =>
        r.data.result.map((s) => {
          const items = [s.entry, ...(s.alt || [])]
          newItems.push(...items)
          const ents = new Set(items)
          const i = seg.findIndex((s1) => ents.has(s1.entry))

          if (i >= 0) {
            if (!s.english.length) {
              s.english = this.entries[offset + i].english || ['???']
            }

            seg[i] = s
          } else {
            seg[i] = this.entries[offset + i]
          }
        })
      )

    this.list = [
      ...this.list.slice(0, offset),
      ...seg,
      ...this.list.slice(offset + this.perPage),
    ]

    const entriesSet = new Set(entries)
    newItems = [...new Set(newItems.filter((s) => entriesSet.has(s)))]
    if (newItems.length > 0) {
      await this.reload(newItems)
    }
  }

  getTagClass(item: string) {
    const srsLevel = this.srsLevel[item]

    if (typeof srsLevel !== 'undefined') {
      if (srsLevel === -1) {
        return 'is-info'
      }

      for (const fn of this.tagClassMap) {
        const c = fn(srsLevel)
        if (c) {
          return c
        }
      }
    }

    return 'is-light'
  }
}
</script>

<style lang="scss" scoped>
.tag {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.card-content[data-mode='item'] {
  max-height: 400px;
  overflow: scroll;
}

.has-context:hover {
  color: blue;
  cursor: pointer;
}
</style>

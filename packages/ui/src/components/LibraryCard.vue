<template>
  <section>
    <b-collapse v-model="isOpen" class="card" animation="slide">
      <div slot="trigger" slot-scope="props" class="card-header" role="button">
        <p
          class="card-header-title"
          @contextmenu.prevent="
            (evt) => {
              selected = currentData
              $refs.context.open(evt)
            }
          "
        >
          {{ title }}
        </p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'caret-down' : 'caret-up'"> </b-icon>
        </a>
      </div>
      <div class="card-content">
        <div>
          <span
            v-for="t in currentData"
            :key="t"
            class="tag clickable"
            :class="getTagClass(t)"
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
    </b-collapse>

    <ContextMenu
      ref="context"
      type="vocab"
      :entry="selected"
      :description="title + ' ' + description"
      :additional="additional"
      @quiz:added="(evt) => reload(evt.entries)"
      @quiz:removed="(evt) => reload(evt.entries)"
    />
  </section>
</template>

<script lang="ts">
import { api } from '@/assets/api'
import { Vue, Component, Ref, Prop } from 'vue-property-decorator'
import ContextMenu from './ContextMenu.vue'

@Component<LibraryCard>({
  components: {
    ContextMenu
  },
  watch: {
    isOpen () {
      if (this.isOpen) {
        this.reload(this.currentData)
      }
    },
    entries () {
      this.isOpen = false
    }
  }
})
export default class LibraryCard extends Vue {
  @Prop() title!: string
  @Prop() entries!: string[]
  @Prop({ default: '' }) description?: string

  @Prop({ default: () => [] }) additional!: {
    name: string;
    handler: () => void;
  }[]

  @Ref() context!: ContextMenu

  isOpen = false

  selected: string[] = []
  srsLevel: {
    [entry: string]: number;
  } = {}

  readonly tagClassMap = [
    (lv: number) => (lv > 2 ? 'is-success' : ''),
    (lv: number) => (lv > 0 ? 'is-warning' : ''),
    (lv: number) => (lv === 0 ? 'is-danger' : '')
  ]

  get currentData () {
    return this.entries.filter((a, i, arr) => arr.indexOf(a) === i)
  }

  async reload (entries: string[]) {
    if (entries.length > 0) {
      const {
        data: { result = [] }
      } = await api.post<{
        result: {
          entry: string;
          srsLevel: number | null;
        }[];
      }>('/api/quiz/srsLevel', {
        entries,
        type: 'vocab',
        select: ['entry', 'srsLevel']
      })

      // eslint-disable-next-line array-callback-return
      entries.map((entry) => {
        delete this.srsLevel[entry]
      })

      // eslint-disable-next-line array-callback-return
      result.map(({ entry, srsLevel }) => {
        this.srsLevel[entry] = typeof srsLevel === 'number' ? srsLevel : -1
      })

      this.$set(this, 'srsLevel', this.srsLevel)
      this.$forceUpdate()
    }
  }

  getTagClass (item: string) {
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

<style scoped>
.tag {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.card-content {
  max-height: 400px;
  overflow: scroll;
}
</style>

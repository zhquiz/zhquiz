<template>
  <section>
    <b-loading v-if="isLoading" active />
    <div v-if="Object.keys(allData).length > 0" class="LevelPage container">
      <div class="field">
        <label class="label">Filter</label>
        <b-field>
          <b-radio-button
            v-model="whatToShow"
            native-value="all"
            type="is-success"
          >
            Show all
          </b-radio-button>
          <b-radio-button
            v-model="whatToShow"
            native-value="all-quiz"
            type="is-info"
          >
            All quiz
          </b-radio-button>
          <b-radio-button
            v-model="whatToShow"
            native-value="learning"
            type="is-warning"
          >
            Learning
          </b-radio-button>
        </b-field>
      </div>

      <b-table :data="currentData">
        <b-table-column v-slot="props" field="level" label="Level" width="40">
          <span
            class="clickable"
            @contextmenu.prevent="
              (evt) => {
                selected = allData[props.row.level]
                $refs.context.open(evt)
              }
            "
          >
            {{ props.row.level }}
          </span>
        </b-table-column>

        <b-table-column v-slot="props" field="entries" label="Item">
          <div>
            <span
              v-for="t in props.row.entries"
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
        </b-table-column>
      </b-table>
    </div>

    <ContextMenu
      ref="context"
      type="vocab"
      :entry="selected"
      :pinyin="pinyinMap"
      @quiz:added="(evt) => reload(evt.entries)"
      @quiz:removed="(evt) => reload(evt.entries)"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import ContextMenu from '@/components/ContextMenu.vue'
import { api } from '@/assets/api'
import toPinyin from 'chinese-to-pinyin'

@Component<LevelPage>({
  components: {
    ContextMenu
  },
  created () {
    const { frameElement } = window
    if (frameElement) {
      const id = parseInt(frameElement.getAttribute('data-id') || '')
      window.parent.setName(id, 'Level')
    }
    this.init()
  },
  watch: {
    whatToShow () {
      this.onWhatToShowChanged()
    }
  }
})
export default class LevelPage extends Vue {
  @Ref() context!: ContextMenu

  isLoading = true

  allData: {
    [level: string]: string[];
  } = {}

  srsLevel: {
    [entry: string]: number;
  } = {}

  selected: string[] = []

  tagClassMap = [
    (lv: number) => (lv > 2 ? 'is-success' : ''),
    (lv: number) => (lv > 0 ? 'is-warning' : ''),
    (lv: number) => (lv === 0 ? 'is-danger' : '')
  ]

  whatToShow = 'all'
  currentData: {
    level: number;
    entries: string[];
  }[] = []

  pinyinMap: Record<string, string> = {}

  setCurrentData () {
    this.currentData = Object.entries(this.allData)
      .map(([_lv, entries]) => {
        const level = parseInt(_lv)

        return {
          level,
          entries: Array.from(entries)
            .filter((v) => {
              if (this.whatToShow === 'all') {
                return true
              }

              if (this.whatToShow === 'learning') {
                if (this.srsLevel[v] <= 2) {
                  return true
                }
              }

              if (this.whatToShow === 'all-quiz') {
                if (typeof this.srsLevel[v] !== 'undefined') {
                  return true
                }
              }

              return false
            })
            .sort()
        }
      })
      .filter((a) => {
        return a.entries.length > 0
      })
      .sort((a, b) => a.level - b.level)
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

  async init () {
    const {
      data: { 'settings.level.whatToShow': whatToShow = null }
    } = await api.get('/api/user', {
      params: {
        select: ['settings.level.whatToShow']
      }
    })

    if (whatToShow) {
      this.whatToShow = (whatToShow as unknown) as string
    }

    await this.reload([])
    this.isLoading = false
  }

  async reload (entries: string[]) {
    if (this.currentData.length === 0) {
      const {
        data: { result }
      } = await api.get<{
        result: {
          entry: string;
          source?: string;
          level: number;
        }[];
      }>('/api/vocab/level')

      entries = result.map(({ entry, source, level }) => {
        if (source && source !== 'cedict') {
          this.pinyinMap[entry] = toPinyin(entry, {
            keepRest: true,
            toneToNumber: true
          })
        }

        const lv = level.toString()
        const levelData = this.allData[lv] || []
        levelData.push(entry)
        this.allData[lv] = levelData

        return entry
      })

      this.$set(this, 'pinyinMap', this.pinyinMap)
      this.$set(this, 'allData', this.allData)
    }

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
      this.setCurrentData()
    }
  }

  async onWhatToShowChanged () {
    this.setCurrentData()

    await api.patch('/api/user', {
      'settings.level.whatToShow': this.whatToShow
    })
  }
}
</script>

<style scoped>
.tag {
  margin-right: 0.5rem;
}

.b-table {
  margin-bottom: 2rem;
}
</style>

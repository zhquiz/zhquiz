<template>
  <section>
    <div class="LevelPage container">
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

      <section class="card">
        <div class="card-content">
          <LibraryCard
            v-for="{ level, entries } in sublist"
            :key="level"
            :title="`Level ${level}`"
            :entries="entries.map((entry) => ({ entry }))"
            :type="type"
            :open="true"
          />

          <b-pagination
            class="mt-4"
            v-if="list.length > perPage"
            v-model="page"
            :total="list.length"
            :per-page="perPage"
            icon-prev="angle-left"
            icon-next="angle-right"
            @change="(p) => (page = p)"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import LibraryCard from './LibraryCard.vue'

@Component<LevelCard>({
  components: {
    LibraryCard,
  },
  created() {
    this.init()
  },
  watch: {
    whatToShow() {
      this.onWhatToShowChanged()
    },
  },
})
export default class LevelCard extends Vue {
  @Prop() type!: 'character' | 'vocabulary'

  isLoading = true

  list: {
    level: number
    entries: string[]
  }[] = []

  whatToShow = 'all'
  page = 1
  perPage = 5

  get sublist() {
    return this.list.slice(
      (this.page - 1) * this.perPage,
      this.page * this.perPage
    )
  }

  async init() {
    const {
      data: { levelBrowser: whatToShow },
    } = await this.$axios.userGetSettings({
      select: 'levelBrowser',
    })

    if (whatToShow) {
      this.whatToShow = whatToShow[0]
    }

    await this.setCurrentData()
    this.isLoading = false
  }

  async setCurrentData() {
    const {
      data: { result },
    } = await this.$axios.libraryListLevel({
      type: this.type,
      whatToShow: this.whatToShow,
    })

    const allData = new Map<number, string[]>()

    result.map(({ entry, level }) => {
      const levelData = allData.get(level) || []
      levelData.push(entry)
      allData.set(level, levelData)
    })

    this.list = Array.from(allData)
      .sort(([lv1], [lv2]) => lv1 - lv2)
      .map(([level, entries]) => ({ level, entries }))
  }

  async onWhatToShowChanged() {
    this.setCurrentData()
    await this.$axios.userUpdateSettings(null, {
      levelBrowser: [this.whatToShow],
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

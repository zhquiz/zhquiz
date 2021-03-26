<template>
  <section>
    <div class="ExtraPage container">
      <form class="field is-grouped" @submit.prevent="q = q0">
        <b-field class="is-expanded" label="Search" label-position="on-border">
          <input
            v-model="q0"
            class="input"
            type="search"
            name="q"
            placeholder="Type here to search"
            aria-label="search"
          />
        </b-field>

        <button
          class="control button is-success"
          type="button"
          @click="onNewItem"
        >
          Add new item
        </button>
      </form>

      <b-table
        :data="tableData"
        :columns="tableHeader"
        paginated
        backend-pagination
        :total="count"
        :per-page="perPage"
        :current-page.sync="page"
        backend-sorting
        :default-sort="[sort.key, sort.type]"
        @contextmenu="onTableContextmenu"
        @sort="onSort"
      >
      </b-table>
    </div>

    <b-modal v-model="isEditModal">
      <div class="card">
        <header class="card-header">
          <div v-if="!selected.id" class="card-header-title">New item</div>
          <div v-else class="card-header-title">Edit item</div>
        </header>
        <div class="card-content">
          <b-field label="Chinese">
            <b-input
              :value="selected.entry.join(' ')"
              @input="(ev) => (selected.entry = ev.split(' '))"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Pinyin">
            <b-input
              :value="selected.reading.join(' ')"
              @input="(ev) => (selected.reading = ev.split(' '))"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="English">
            <b-input
              :value="selected.english.join(' ')"
              @input="(ev) => (selected.english = ev.split(' '))"
              type="textarea"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Type">
            <b-select v-model="selected.type">
              <option value="vocabulary">Vocabulary</option>
              <option value="sentence">Sentence</option>
              <option
                v-if="selected.entry.every((el) => el.length === 1)"
                value="character"
              >
                Hanzi
              </option>
            </b-select>
          </b-field>
          <b-field label="Description">
            <b-input v-model="selected.description" type="textarea"></b-input>
          </b-field>
          <b-field label="Tag">
            <b-input v-model="selected.tag"></b-input>
          </b-field>
        </div>
        <footer class="card-footer">
          <div class="card-footer-item">
            <button
              class="button is-success"
              type="button"
              @click="selected.id ? doUpdate() : doCreate()"
            >
              Save
            </button>
            <button
              class="button is-cancel"
              type="button"
              @click="isEditModal = false"
            >
              Cancel
            </button>
          </div>
        </footer>
      </div>
    </b-modal>

    <ContextMenu
      :id="selected.id"
      ref="context"
      :entry="selected.entry[0]"
      :type="selected.type || 'vocabulary'"
      :description="selected.description"
      source="extra"
      :additional="additionalContext"
      @deleted="doDelete"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import ContextMenu from '@/components/ContextMenu.vue'
import toPinyin from 'chinese-to-pinyin'

interface IExtra {
  id?: string
  entry: string[]
  reading: string[]
  english: string[]
  type: 'character' | 'vocabulary' | 'sentence'
  description?: string
  tag: string[]
}

@Component<ExtraPage>({
  components: {
    ContextMenu,
  },
  created() {
    this.$emit('title', 'Browse')
    this.load()
  },
})
export default class ExtraPage extends Vue {
  @Ref() context!: ContextMenu

  q0 = ''
  count = 0
  perPage = 10
  page = 1
  tableData: IExtra[] = []
  readonly tableHeader = [
    { field: 'entry', label: 'Entry' },
    { field: 'reading', label: 'Pinyin' },
    { field: 'english', label: 'English', width: '40vw' },
  ]

  isEditModal = false

  sort = {
    key: 'updatedAt',
    type: 'desc',
  }

  selected: IExtra = {
    id: '',
    entry: [],
    reading: [],
    english: [],
    type: 'vocabulary',
    description: '',
    tag: [],
  }

  additionalContext = [
    {
      name: 'Edit item',
      handler: () => {
        this.openEditModal()
      },
    },
    {
      name: 'Delete item',
      handler: () => {
        this.doDelete()
      },
    },
  ]

  get q() {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q(q: string) {
    this.$router.push({ query: { q } })
  }

  openEditModal() {
    if (!this.selected.reading.length && this.selected.reading.length) {
      this.selected.reading = [
        toPinyin(this.selected.entry[0], {
          keepRest: true,
          toneToNumber: true,
        }),
      ]
    }

    if (!this.selected.description) {
      this.$set(this.selected, 'description', '')
    }

    this.isEditModal = true
  }

  @Watch('page')
  @Watch('perPage')
  @Watch('q')
  async load() {
    const {
      data: { result, count },
    } = await this.$axios.extraQuery({
      q: this.q,
      page: this.page,
      limit: this.perPage,
    })

    this.tableData = result
    this.count = count
  }

  async doCreate() {
    const {
      data: { id },
    } = await this.$axios.extraCreate(null, {
      ...this.selected,
      description: this.selected.description || '',
    })

    this.selected.id = id

    await this.context.addToQuiz()
    this.$buefy.snackbar.open(`Added extra: ${this.selected.entry[0]} to quiz`)

    this.isEditModal = false
    await this.load()
  }

  async doUpdate() {
    const { id } = this.selected

    if (id) {
      await this.$axios.extraUpdate(id, {
        ...this.selected,
        description: this.selected.description || '',
      })

      this.$buefy.snackbar.open(`Updated extra: ${this.selected.entry[0]}`)
    }

    this.isEditModal = false
    await this.load()
  }

  async doDelete() {
    const { id } = this.selected

    if (id) {
      this.$axios.extraDelete({ id })

      this.$buefy.snackbar.open(`Deleted extra: ${this.selected.entry[0]}`)
      await this.load()
    }
  }

  onNewItem() {
    this.selected = {
      id: '',
      entry: [],
      reading: [],
      english: [],
      type: 'vocabulary',
      description: '',
      tag: [],
    }

    this.isEditModal = true
  }

  async onTableContextmenu(row: IExtra, evt: MouseEvent) {
    evt.preventDefault()

    this.selected = row
    this.context.open(evt)
  }

  async onSort(key: string, type: string) {
    this.sort.key = key
    this.sort.type = type
    await this.load()
  }
}
</script>

<style lang="scss" scoped>
.b-table ::v-deep tr:hover {
  cursor: pointer;
  color: blue;
}

.button + .button {
  margin-left: 1rem;
}

.button.is-cancel {
  background-color: rgb(215, 217, 219);
}
</style>

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
              v-model="selected.chinese"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Pinyin">
            <b-input
              v-model="selected.pinyin"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="English">
            <b-input
              v-model="selected.english"
              type="textarea"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Type">
            <b-select v-model="selected.type">
              <option value="vocab">Vocab</option>
              <option value="sentence">Sentence</option>
              <option v-if="selected.chinese.length === 1" value="hanzi">
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
      :entry="selected.chinese"
      :type="selected.type || 'vocab'"
      :description="selected.description"
      source="extra"
      :additional="additionalContext"
      @deleted="doDelete"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import ContextMenu from '@/components/ContextMenu.vue'
import { api } from '@/assets/api'
import toPinyin from 'chinese-to-pinyin'

interface IExtra {
  id?: string;
  chinese: string;
  pinyin: string;
  english: string;
  type: 'hanzi' | 'vocab' | 'sentence';
  description: string;
  tag: string;
}

@Component<ExtraPage>({
  components: {
    ContextMenu
  },
  created () {
    const { frameElement } = window
    if (frameElement) {
      const id = parseInt(frameElement.getAttribute('data-id') || '')
      window.parent.setName(id, 'Extra')
    }
    this.load()
  }
})
export default class ExtraPage extends Vue {
  @Ref() context!: ContextMenu

  q0 = ''
  count = 0
  perPage = 10
  page = 1
  tableData: IExtra[] = []
  readonly tableHeader = [
    { field: 'chinese', label: 'Chinese', sortable: true },
    { field: 'pinyin', label: 'Pinyin', sortable: true },
    { field: 'english', label: 'English', sortable: true, width: '40vw' }
  ]

  isEditModal = false

  sort = {
    key: 'updatedAt',
    type: 'desc'
  }

  selected: IExtra = {
    id: '',
    chinese: '',
    pinyin: '',
    english: '',
    type: 'vocab',
    description: '',
    tag: ''
  }

  additionalContext = [
    {
      name: 'Edit item',
      handler: () => {
        this.openEditModal()
      }
    },
    {
      name: 'Delete item',
      handler: () => {
        this.doDelete()
      }
    }
  ]

  get q () {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q (q: string) {
    this.$router.push({ query: { q } })
  }

  openEditModal () {
    if (!this.selected.pinyin) {
      this.selected.pinyin = toPinyin(this.selected.chinese, {
        keepRest: true,
        toneToNumber: true
      })
    }

    this.isEditModal = true
  }

  @Watch('page')
  @Watch('perPage')
  @Watch('q')
  async load () {
    const {
      data: { result, count }
    } = await api.get('/api/extra/q', {
      params: {
        q: this.q,
        page: this.page,
        perPage: this.perPage,
        sort: [`${this.sort.type === 'desc' ? '-' : ''}${this.sort.key}`],
        select: [
          'id',
          'chinese',
          'pinyin',
          'english',
          'type',
          'description',
          'tag'
        ]
      }
    })

    this.tableData = result
    this.count = count
  }

  async doCreate () {
    this.selected.description = this.selected.description || ' '
    this.selected.tag = this.selected.tag || ' '

    const {
      data: { existing, id }
    } = await api.put('/api/extra', this.selected)

    if (id) {
      await this.context.addToQuiz()
      this.$buefy.snackbar.open(`Added extra: ${this.selected.chinese} to quiz`)

      await this.load()
    } else if (existing) {
      const { type, entry } = existing
      await api.put('/api/quiz', {
        entries: [entry],
        type,
        source: 'extra'
      })

      this.$buefy.snackbar.open(`Added ${type}: ${entry} to quiz`)
    }

    this.isEditModal = false
    await this.load()
  }

  async doUpdate () {
    this.selected.description = this.selected.description || ' '
    this.selected.tag = this.selected.tag || ' '

    await api.patch('/api/extra', this.selected, {
      params: {
        id: this.selected.id
      }
    })

    this.$buefy.snackbar.open(`Updated extra: ${this.selected.chinese}`)

    this.isEditModal = false
    await this.load()
  }

  async doDelete () {
    await api.delete('/api/extra', {
      params: {
        id: this.selected.id
      }
    })

    this.$buefy.snackbar.open(`Deleted extra: ${this.selected.chinese}`)

    await this.load()
  }

  async onNewItem () {
    this.selected = {
      id: '',
      chinese: '',
      pinyin: '',
      english: '',
      type: 'vocab',
      description: '',
      tag: ''
    }

    this.isEditModal = true
  }

  async onTableContextmenu (row: IExtra, evt: MouseEvent) {
    evt.preventDefault()

    this.selected = row
    await this.context.open(evt)
  }

  async onSort (key: string, type: string) {
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

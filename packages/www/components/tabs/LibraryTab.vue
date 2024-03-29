<template>
  <section>
    <div class="LibraryPage">
      <form @submit.prevent="q = q0">
        <label for="q" class="label">
          Search
          <b-tooltip label="How to?" position="is-right">
            <a
              href="https://github.com/zhquiz/zhquiz/wiki/How-to-search-or-filter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <b-icon icon="info-circle"></b-icon>
            </a>
          </b-tooltip>
        </label>
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              v-model="q0"
              class="input"
              type="search"
              name="q"
              placeholder="Type here to search"
              aria-label="search"
            />
          </p>
          <p class="control">
            <button
              class="button is-success"
              type="button"
              @click="openEditModal()"
            >
              Add new item
            </button>
          </p>
        </div>
      </form>

      <div class="columns mt-4">
        <div class="column">
          <section class="card">
            <div class="card-content">
              <LibraryCard
                v-for="(it, i) in local.result"
                :id="it.id"
                :key="i"
                :title="it.title"
                :entries="it.entries"
                :type="it.type"
                :description="it.description"
                :additional="additionalContext(it)"
              />

              <b-pagination
                v-if="local.count > local.perPage"
                v-model="local.page"
                :total="local.count"
                :per-page="local.perPage"
                icon-prev="angle-left"
                icon-next="angle-right"
                @change="(p) => (local.page = p)"
              />
            </div>
          </section>
        </div>
      </div>
    </div>

    <b-modal v-model="isEditModal">
      <div class="card">
        <header class="card-header">
          <div v-if="!edited.id" class="card-header-title">New list</div>
          <div v-else class="card-header-title">Edit list</div>
        </header>
        <div class="card-content">
          <b-field label="Title">
            <b-input
              v-model="edited.title"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Entries">
            <template slot="label">
              Entries
              <b-tooltip type="is-dark" label="Space or new-line separated">
                <b-icon size="is-small" icon="info-circle"></b-icon>
              </b-tooltip>
            </template>
            <b-input
              v-model="entryString"
              type="textarea"
              placeholder="Space or new-line separated, must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Description">
            <b-input v-model="edited.description" type="textarea"></b-input>
          </b-field>
          <b-field label="Tag">
            <b-taginput v-model="edited.tag"></b-taginput>
          </b-field>
          <b-field label="Additional options">
            <b-checkbox
              :value="edited.isShared"
              @input="(ev) => $set(edited, 'isShared', ev)"
            >
              Make it availble for others (shared library)
            </b-checkbox>
          </b-field>
        </div>
        <footer class="card-footer">
          <div class="card-footer-item">
            <button
              class="button is-success"
              type="button"
              @click="edited.id ? doUpdate() : doCreate()"
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
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'nuxt-property-decorator'
import LibraryCard from '../cards/LibraryCard.vue'

interface ILocal {
  id?: string
  title: string
  entries: {
    entry: string
    alt?: string[]
    reading?: string[]
    english?: string[]
  }[]
  type: 'vocabulary' | 'character' | 'sentence'
  description: string
  tag: string[]
  isShared?: boolean
}

@Component<LibraryTab>({
  components: {
    LibraryCard,
  },
  created() {
    this.$emit('title', 'Library')
    this.updateLocal()
  },
})
export default class LibraryTab extends Vue {
  q = ''
  q0 = ''
  isEditModal = false

  local: {
    result: ILocal[]
    count: number
    page: number
    perPage: number
  } = {
    result: [],
    count: 0,
    page: 1,
    perPage: 10,
  }

  online: {
    result: {
      title: string
      entry: string[]
    }[]
    count: number
    page: number
    perPage: number
  } = {
    result: [],
    count: 0,
    page: 1,
    perPage: 10,
  }

  edited: ILocal = {
    id: '',
    title: '',
    entries: [],
    type: 'vocabulary',
    description: '',
    tag: [],
  }

  get entryString() {
    return this.edited.entries.map(({ entry }) => entry).join('\n')
  }

  set entryString(s) {
    const out: string[] = []

    let m: RegExpExecArray | null = null
    const re = /\p{sc=Han}+/gsu
    while ((m = re.exec(s))) {
      out.push(m[0])
    }

    this.edited.entries = out.map((entry) => ({ entry }))
  }

  additionalContext(it: ILocal) {
    if (!it.id) {
      return []
    }

    return [
      {
        name: 'Edit list',
        handler: () => {
          this.openEditModal()
        },
      },
      {
        name: 'Delete list',
        handler: () => {
          if (it.id) {
            this.doDelete(it.id)
          }
        },
      },
    ]
  }

  openEditModal(it?: ILocal) {
    this.edited = it || {
      id: '',
      title: '',
      entries: [],
      type: 'vocabulary',
      description: '',
      tag: [],
    }

    this.isEditModal = true
  }

  @Watch('q')
  @Watch('local.page')
  async updateLocal() {
    const { data: r } = await this.$axios.libraryQuery({
      q: this.q,
      page: this.local.page,
      limit: this.local.perPage,
    })

    this.local = {
      ...this.local,
      ...r,
      result: r.result.map((r) => ({
        ...r,
        type: r.type as any,
      })),
    }
  }

  async doCreate() {
    await this.$axios.libraryCreate(null, {
      ...this.edited,
      type: 'vocabulary',
    })

    this.$buefy.snackbar.open(`Created list: ${this.edited.title}`)
    this.isEditModal = false

    this.local.page = 1
    await this.updateLocal()
  }

  async doUpdate() {
    const { id } = this.edited

    if (id) {
      await this.$axios.libraryUpdate(
        { id },
        {
          ...this.edited,
          type: 'vocabulary',
        }
      )

      this.$buefy.snackbar.open(`Updated list: ${this.edited.title}`)
    }

    this.isEditModal = false

    this.local.page = 1
    await this.updateLocal()
  }

  async doDelete(id: string) {
    await this.$axios.libraryDelete({ id })

    this.$buefy.snackbar.open(`Deleted list: ${this.edited.title}`)

    this.local.page = 1
    await this.updateLocal()
  }
}
</script>

<style scoped>
nav.pagination {
  margin-top: 1rem;
}

.button + .button {
  margin-left: 1rem;
}

.button.is-cancel {
  background-color: rgb(215, 217, 219);
}
</style>

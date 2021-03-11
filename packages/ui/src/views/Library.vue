<template>
  <section>
    <div class="LibraryPage">
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
      </form>

      <div class="columns">
        <div class="column">
          <section class="card">
            <div class="card-content">
              <h2 class="title is-4">
                User library
                <button
                  class="button is-success"
                  style="float: right"
                  @click="openEditModal()"
                >
                  Create a list
                </button>
              </h2>

              <LibraryCard
                v-for="(it, i) in local.result"
                :id="it.id"
                :key="i"
                :title="it.title"
                :entries="it.entries"
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
        <div class="column">
          <section class="card">
            <div class="card-content">
              <h2 class="title is-4">Online library</h2>

              <LibraryCard
                v-for="(it, i) in online.result"
                :key="i"
                :title="it.title"
                :entries="it.entries"
                :description="it.description"
              />

              <b-pagination
                v-if="online.count > online.perPage"
                v-model="online.page"
                :total="online.count"
                :per-page="online.perPage"
                icon-prev="angle-left"
                icon-next="angle-right"
                @change="(p) => (online.page = p)"
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
            <b-input
              v-model="entryString"
              type="textarea"
              placeholder="Space separated, must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Description">
            <b-input v-model="edited.description" type="textarea"></b-input>
          </b-field>
          <b-field label="Tag">
            <b-input v-model="edited.tag"></b-input>
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
import { api } from '@/assets/api'
import { Component, Vue, Watch } from 'vue-property-decorator'
import LibraryCard from '@/components/LibraryCard.vue'

interface ILocal {
  id: string;
  title: string;
  entries: string[];
  description: string;
  tag: string;
}

@Component<LibraryPage>({
  components: {
    LibraryCard
  },
  async created () {
    const { frameElement } = window
    if (frameElement) {
      const id = parseInt(frameElement.getAttribute('data-id') || '')
      window.parent.setName(id, 'Library')
    }
    await Promise.all([this.updateLocal(), this.updateOnline()])
  }
})
export default class LibraryPage extends Vue {
  q0 = ''
  isEditModal = false

  local: {
    result: ILocal[];
    count: number;
    page: number;
    perPage: number;
  } = {
    result: [],
    count: 0,
    page: 1,
    perPage: 10
  }

  online: {
    result: {
      title: string;
      entries: string[];
    }[];
    count: number;
    page: number;
    perPage: number;
  } = {
    result: [],
    count: 0,
    page: 1,
    perPage: 10
  }

  edited: ILocal = {
    id: '',
    title: '',
    entries: [],
    description: '',
    tag: ''
  }

  get q () {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q (q: string) {
    this.$router.push({ query: { q } })
  }

  get entryString () {
    return this.edited.entries.join(' ')
  }

  set entryString (s) {
    const out: string[] = []

    let m: RegExpExecArray | null = null
    const re = /\p{sc=Han}+/gu
    while ((m = re.exec(s))) {
      out.push(m[0])
    }

    this.edited.entries = out
  }

  additionalContext (it: ILocal) {
    if (!it.id) {
      return []
    }

    return [
      {
        name: 'Edit list',
        handler: () => {
          this.openEditModal()
        }
      },
      {
        name: 'Delete list',
        handler: () => {
          this.doDelete(it.id)
        }
      }
    ]
  }

  openEditModal (it?: ILocal) {
    this.edited = it || {
      id: '',
      title: '',
      entries: [],
      description: '',
      tag: ''
    }

    this.isEditModal = true
  }

  @Watch('q')
  @Watch('local.page')
  async updateLocal () {
    const r = await api
      .get('/api/library/q', {
        params: {
          q: this.q,
          page: this.local.page,
          perPage: this.local.perPage
        }
      })
      .then((r) => r.data)

    this.local = {
      ...this.local,
      ...r
    }
  }

  @Watch('q')
  @Watch('online.page')
  async updateOnline () {
    const r = await fetch(
      `https://www.zhquiz.cc/api/library?q=${encodeURIComponent(
        this.q
      )}&page=${encodeURIComponent(
        this.online.page
      )}&perPage=${encodeURIComponent(this.online.perPage)}`
    ).then((r) => r.json())

    this.online = {
      ...this.online,
      ...r
    }
  }

  async doCreate () {
    await api.put('/api/library', this.edited)
    this.$buefy.snackbar.open(`Created list: ${this.edited.title}`)
    this.isEditModal = false

    this.local.page = 1
    await this.updateLocal()
  }

  async doUpdate () {
    await api.patch('/api/library', this.edited, {
      params: {
        id: this.edited.id
      }
    })

    this.$buefy.snackbar.open(`Updated list: ${this.edited.title}`)
    this.isEditModal = false

    this.local.page = 1
    await this.updateLocal()
  }

  async doDelete (id: string) {
    await api.delete('/api/library', {
      params: {
        id
      }
    })

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

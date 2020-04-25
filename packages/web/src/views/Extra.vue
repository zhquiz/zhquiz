<template lang="pug">
.container#Extra
  b-message(type="is-warning" title="Avoid duplicate contents." has-icon v-if="userContentWarning"
    @close="onUserContentWarningClose"
  )
    p You should not add user content as a duplicate to the dictionary.
    p If so, go to respective section
  .new-item-panel
    .full-width
      b-field(label="Chinese")
        b-input(v-model="newItem.chinese")
    .full-width
      b-field(label="Pinyin")
        b-input(v-model="newItem.pinyin")
    .full-width
      b-field(label="English")
        b-input(v-model="newItem.english")
    .full-width-tablet
      button.button.is-success(:disabled="!newItem.chinese || !newItem.english" style="width: 100%;"
        @click="addNewItem"
      ) Add
  b-table(
    :data="data"
    :columns="dataHeader"

    @contextmenu="onTableContextmenu"
    checkable

    paginated
    backend-pagination
    :total="count"
    :per-page="perPage"
    :current-page.sync="page"

    backend-sorting
    :default-sort="[sort.key, sort.type]"
    @sort="onSort"
  )
  vue-context(ref="contextmenu" lazy)
    li
      a(role="button" @click.prevent="speak()") Speak
    li(v-if="!cardIds[selectedRow.chinese] || !cardIds[selectedRow.chinese].length")
      a(role="button" @click.prevent="addToQuiz()") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz()") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: selectedRow.chinese } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/hanzi', query: { q: selectedRow.chinese } }" target="_blank") Search for Hanzi
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${selectedRow.chinese}*`"
        target="_blank" rel="noopener") Open in MDBG
    li
      a(role="button" @click.prevent="doDelete()") Delete
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { AxiosInstance } from 'axios'
import { speak } from '../utils'

@Component
export default class Extra extends Vue {
  data: any = []
  count = 0
  perPage = 10
  page = 1
  dataHeader = [
    { field: 'chinese', label: 'Chinese', sortable: true },
    { field: 'pinyin', label: 'Pinyin', sortable: true },
    { field: 'english', label: 'English', sortable: true }
  ]

  sort = {
    key: 'updatedAt',
    type: 'desc'
  }

  userContentWarning = false

  newItem: any = {}
  selectedRow: any = {}
  cardIds: any = {}

  speak = speak

  created () {
    this.load()
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('$store.state.user')
  async onUserChange () {
    if (this.$store.state.user) {
      const api = await this.getApi(false)
      const r = await api.get('/api/user/')
      this.userContentWarning = r.data.userContentWarning !== false
      await this.load()
    } else {
      this.$set(this, 'data', [])
      this.userContentWarning = false
    }
  }

  @Watch('page')
  async load () {
    const api = await this.getApi(false)
    const r = await api.post('/api/extra/q', {
      offset: (this.page - 1) * this.perPage,
      limit: this.perPage,
      sort: {
        [this.sort.key]: this.sort.type === 'desc' ? -1 : 1
      }
    })

    this.$set(this, 'data', r.data.result)
    this.count = r.data.count
  }

  async onUserContentWarningClose () {
    this.userContentWarning = false

    const api = await this.getApi(false)
    const r = await api.patch('/api/user/', {
      set: { userContentWarning: this.userContentWarning }
    })
  }

  async addNewItem () {
    const api = await this.getApi(false)
    await api.put('/api/extra/', this.newItem)
    this.$set(this, 'newItem', {})
    await this.load()
  }

  async doDelete () {
    const api = await this.getApi(false)
    await api.delete('/api/extra/', {
      data: {
        ids: [this.selectedRow._id]
      }
    })
    await this.load()
  }

  onTableContextmenu (row: any, evt: MouseEvent) {
    evt.preventDefault()

    this.selectedRow = row
    const contextmenu = this.$refs.contextmenu as any
    contextmenu.open(evt)
  }

  @Watch('selectedRow')
  async loadVocabStatus () {
    if (this.selectedRow.chinese) {
      const api = await this.getApi()
      const r = await api.post('/api/card/q', {
        cond: {
          item: this.selectedRow.chinese,
          type: 'extra'
        },
        projection: {
          _id: 1
        },
        hasCount: false
      })

      this.$set(this.cardIds, this.selectedRow.chinese, r.data.result.map((r: any) => r._id))
    }
  }

  async addToQuiz () {
    const type = 'extra'
    const item = this.selectedRow.chinese

    const api = await this.getApi()
    await api.put('/api/card/', { item, type })
    this.$buefy.snackbar.open(`Added ${type}: ${item} to quiz`)

    this.loadVocabStatus()
  }

  async removeFromQuiz () {
    const type = 'extra'
    const item = this.selectedRow.chinese

    const ids = this.cardIds[item] || []
    const api = await this.getApi()
    await Promise.all(ids.map((id: string) => api.delete('/api/card/', {
      data: { id }
    })))
    this.$buefy.snackbar.open(`Removed ${type}: ${item} from quiz`)

    this.loadVocabStatus()
  }

  onSort (key: string, type: 'desc' | 'asc') {
    this.sort.key = key
    this.sort.type = (type as string)
    this.load()
  }
}
</script>

<style lang="scss">
#Extra {
  .new-item-panel {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;

    > div + div {
      margin-left: 1em;
      margin-top: 0;
    }

    > .full-width {
      width: 100%;
      flex-grow: 1;
    }

    @media screen and (max-width: 1023px) {
      flex-direction: column;
      align-items: flex-end;

      > .full-width-tablet {
        width: 100%;
      }

      > div + div {
        margin-left: 0;
        margin-top: 1em;
      }
    }
  }
}
</style>

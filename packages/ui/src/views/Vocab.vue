<template>
  <section>
    <div class="VocabPage">
      <form class="field" @submit.prevent="q = q0">
        <div class="control">
          <input
            v-model="q0"
            type="search"
            class="input"
            name="q"
            placeholder="Type here to search."
            aria-label="search"
          />
        </div>
      </form>

      <div class="columns">
        <div class="column is-6 entry-display">
          <div
            :class="
              simplified.length > 3 ? 'smaller-vocab-display' : 'vocab-display'
            "
          >
            <div
              class="clickable text-center font-zh-simp"
              @contextmenu.prevent="
                (evt) => openContext(evt, simplified, 'vocab')
              "
            >
              {{ simplified }}
            </div>
          </div>

          <div class="buttons has-addons">
            <button
              class="button"
              :disabled="i < 1"
              @click="i--"
              @keypress="i--"
            >
              Previous
            </button>
            <button
              class="button"
              :disabled="i > entries.length - 2"
              @click="i++"
              @keypress="i++"
            >
              Next
            </button>
          </div>
        </div>

        <div class="column is-6">
          <b-collapse
            class="card"
            animation="slide"
            style="margin-bottom: 1em"
            :open="typeof current === 'object'"
          >
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Reading</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span>{{ current.pinyin }}</span>
            </div>
          </b-collapse>

          <b-collapse
            class="card"
            animation="slide"
            :open="!!current.traditional"
          >
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Traditional</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <div
                class="font-zh-trad clickable"
                @contextmenu.prevent="
                  (evt) => openContext(evt, current.traditional, 'vocab')
                "
              >
                {{ current.traditional }}
              </div>
            </div>
          </b-collapse>

          <b-collapse class="card" animation="slide" :open="!!current.english">
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">English</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <span>{{ current.english }}</span>
            </div>
          </b-collapse>

          <b-collapse
            class="card"
            animation="slide"
            :open="!!sentences().length"
            :key="sentenceKey"
          >
            <div
              slot="trigger"
              slot-scope="props"
              class="card-header"
              role="button"
            >
              <h2 class="card-header-title">Sentences</h2>
              <a role="button" class="card-header-icon">
                <fontawesome :icon="props.open ? 'caret-down' : 'caret-up'" />
              </a>
            </div>

            <div class="card-content">
              <div
                v-for="(s, i) in sentences()"
                :key="i"
                class="sentence-entry"
              >
                <span
                  class="clickable"
                  @contextmenu.prevent="
                    (evt) => openContext(evt, s.chinese, 'sentence')
                  "
                >
                  {{ s.chinese }}
                </span>
                <span>{{ s.english }}</span>
              </div>
            </div>
          </b-collapse>
        </div>
      </div>
    </div>

    <ContextMenu
      ref="context"
      :entry="selected.entry"
      :type="selected.type"
      :additional="additionalContext"
      :pinyin="sentenceDef.pinyin"
      :english="sentenceDef.english"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import toPinyin from 'chinese-to-pinyin'
import ContextMenu from '@/components/ContextMenu.vue'
import { api } from '@/assets/api'
import { findSentence, zhSentence } from '@/assets/db'

@Component<VocabPage>({
  components: {
    ContextMenu
  },
  watch: {
    q () {
      this.onQChange(this.q)
    },
    current () {
      this.loadContent()
    }
  }
})
export default class VocabPage extends Vue {
  @Ref() context!: ContextMenu

  entries: (
    | string
    | {
        simplified: string;
        traditional?: string;
        pinyin: string;
        english?: string;
      }
  )[] = []

  i = 0

  selected: {
    entry: string;
    type: string;
  } = {
    entry: '',
    type: ''
  }

  q0 = ''

  sentenceKey = 0

  sentences () {
    return zhSentence
      .find({
        chinese: {
          $containsString:
            typeof this.current === 'string'
              ? this.current
              : this.current.simplified
        }
      })
      .slice(0, 10)
  }

  get sentenceDef () {
    if (this.selected.type !== 'sentence') {
      return {}
    }

    const it = zhSentence.findOne({ chinese: this.selected.entry })
    if (!it) {
      return {}
    }

    return {
      pinyin: {
        [this.selected.entry]: it.pinyin
      },
      english: {
        [this.selected.entry]: it.english
      }
    }
  }

  get q () {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q (q: string) {
    this.$router.push({ query: { q } })
  }

  get current () {
    const r = this.entries[this.i]
    if (typeof r === 'string') {
      if (/\p{sc=Han}/u.test(r)) {
        return r
      }
      return ''
    }

    return r || ''
  }

  get simplified () {
    return typeof this.current === 'string'
      ? this.current
      : this.current.simplified
  }

  async created () {
    let entry = this.$route.query.entry as string

    if (!(entry || this.q)) {
      const {
        data: { result }
      } = await api.get<{
        result: string;
      }>('/api/vocab/random', {
        params: {
          levelMin: this.$accessor.levelMin,
          level: this.$accessor.level
        }
      })

      entry = result
    }

    this.q0 = entry || this.q

    if (entry) {
      const { frameElement } = window
      if (frameElement) {
        const id = parseInt(frameElement.getAttribute('data-id') || '')
        window.parent.setName(id, (entry ? entry + ' - ' : '') + 'Vocab')
      }

      this.entries = [entry]
      await this.loadContent()
    } else {
      await this.onQChange(this.q0)
    }
  }

  get additionalContext () {
    if (!this.q) {
      return [
        {
          name: 'Reload',
          handler: async () => {
            const {
              data: { result }
            } = await api.get<{
              result: string;
            }>('/api/vocab/random')

            this.q0 = result
          }
        }
      ]
    }

    return []
  }

  openContext (
    evt: MouseEvent,
    entry = this.selected.entry,
    type = this.selected.type
  ) {
    this.selected = { entry, type }
    this.context.open(evt)
  }

  async onQChange (q: string) {
    const { frameElement } = window
    if (frameElement) {
      const id = parseInt(frameElement.getAttribute('data-id') || '')
      window.parent.setName(id, (q ? q + ' - ' : '') + 'Vocab')
    }

    if (/\p{sc=Han}+/u.test(q)) {
      let qs = await api
        .get<{
          result: string[];
        }>('/api/chinese/jieba', { params: { q } })
        .then((r) => r.data.result)

      qs = qs
        .filter((h) => /\p{sc=Han}+/u.test(h))
        .filter((h, i, arr) => arr.indexOf(h) === i)

      this.entries = qs
    } else {
      this.entries = [q]
    }

    await this.loadContent()

    this.i = 0
  }

  async loadContent () {
    let entry = this.entries[this.i]
    if (!entry) {
      return
    }

    if (typeof entry === 'string') {
      if (/\p{sc=Han}/u.test(entry)) {
        const {
          data: { result }
        } = await api.get('/api/vocab', {
          params: {
            entry
          }
        })

        if (result.length > 0) {
          entry = result[0].simplified
          this.entries = [
            ...this.entries.slice(0, this.i),
            ...result,
            ...this.entries.slice(this.i + 1)
          ]
        } else {
          this.entries = [
            ...this.entries.slice(0, this.i),
            {
              simplified: entry,
              pinyin: toPinyin(entry, { keepRest: true, toneToNumber: true })
            },
            ...this.entries.slice(this.i + 1)
          ]
        }
      } else {
        const {
          data: { result }
        } = await api.get('/api/vocab/q', {
          params: {
            q: entry
          }
        })

        if (result.length > 0) {
          entry = result[0].simplified
        } else {
          entry = ''
        }

        this.entries = [
          ...this.entries.slice(0, this.i),
          ...result,
          ...this.entries.slice(this.i + 1)
        ]
      }
    }

    if (!entry) {
      return
    }

    if (
      await findSentence(
        typeof entry === 'string' ? entry : entry.simplified,
        10
      )
    ) {
      this.sentenceKey = Math.random()
    }
  }
}
</script>

<style scoped>
.entry-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.entry-display .clickable {
  min-height: 1.5em;
  display: block;
}

.card {
  margin-bottom: 1rem;
}

.card [class^='font-'] {
  font-size: 60px;
  height: 80px;
}

.card-content {
  max-height: 250px;
  overflow: scroll;
}

.sentence-entry {
  margin-right: 1rem;
}
</style>

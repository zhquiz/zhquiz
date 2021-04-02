<template>
  <b-modal class="quiz-modal" :active.sync="isQuizModal" @close="endQuiz">
    <div class="card">
      <div v-if="current.id" class="card-content">
        <div v-show="!isQuizShownAnswer" class="content">
          <div v-if="current.type === 'character'">
            <div v-if="current.direction === 'ec'">
              <h4>Hanzi English-Chinese</h4>

              <div
                v-html="
                  doMask((current.english || []).join(' / '), current.entry)
                "
              ></div>
            </div>
            <div v-else>
              <h4>Hanzi Chinese-English</h4>
              <div
                class="font-chinese text-w-normal hanzi-display"
                style="text-align: center"
              >
                {{ current.entry }}
              </div>
            </div>
          </div>

          <div v-else-if="current.type === 'vocabulary'">
            <div v-if="current.direction === 'ec'">
              <h4>Vocab English-Chinese</h4>

              <ul v-if="Array.isArray(current.english)">
                <li
                  v-for="(it, i) in current.english"
                  :key="i"
                  v-html="
                    doMask(
                      it,
                      current.entry,
                      ...(current.reading || []),
                      ...(current.alt || [])
                    )
                  "
                ></li>
              </ul>

              <div
                v-else
                v-html="
                  doMask(
                    (current.english || []).join(' / '),
                    current.entry,
                    ...(current.reading || []),
                    ...(current.alt || [])
                  )
                "
              ></div>
            </div>
            <div v-else>
              <h4 v-if="current.direction === 'te'">
                Vocabulary Traditional-English
              </h4>
              <h4 v-else>Vocab Simplified-English</h4>

              <div class="font-zh-simp text-w-normal" style="font-size: 2rem">
                {{ current.entry }}
              </div>
            </div>
          </div>

          <div v-else>
            <div v-if="current.direction === 'ec'">
              <h4>Sentence English-Chinese</h4>

              <ul>
                <li v-for="(e, i) in current.english" :key="i">
                  {{ e }}
                </li>
              </ul>
            </div>
            <div v-else>
              <h4>Sentence Chinese-English</h4>

              <h2 class="font-zh-simp text-w-normal">
                {{ current.entry }}
              </h2>
            </div>
          </div>
        </div>

        <div v-show="isQuizShownAnswer" class="content">
          <div v-if="current.type === 'character'">
            <div
              class="hanzi-display has-context"
              @click="openContext"
              style="text-align: center"
            >
              {{ current.entry }}
            </div>

            <div style="text-align: center; margin-bottom: 1rem">
              {{ (current.reading || []).join(' | ') }}
            </div>

            <div style="text-align: center">
              {{ (current.english || []).join(' / ') }}
            </div>

            <ul v-if="getSentenceByCharacter(current.entry).length">
              <li
                v-for="(it, i) in getSentenceByCharacter(current.entry)"
                :key="i"
              >
                <span
                  class="has-context"
                  :title="it.reading[0]"
                  @click="(ev) => openContext(ev, it.chinese, 'sentence')"
                >
                  {{ it.entry }}
                </span>
                <ul>
                  <li v-for="(e, j) in it.english" :key="j" class="english">
                    {{ e }}
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div v-else-if="current.type === 'vocabulary'">
            <div
              class="font-zh-simp text-w-normal has-context"
              style="font-size: 2rem"
              @click="openContext"
            >
              {{ current.simplified }}
            </div>

            <div
              v-if="current.alt && current.alt.length"
              class="font-zh-trad text-w-normal"
              style="font-size: 1.7rem"
            >
              <span
                v-for="(it, i) in current.alt"
                :key="i"
                class="traditional has-context"
                @click="(ev) => openContext(ev, it)"
              >
                {{ it }}
              </span>
            </div>

            <div>
              {{ (current.reading || []).join(' | ') }}
            </div>

            <ul>
              <li v-for="(it, i) in current.english" :key="i">
                {{ it }}
              </li>
            </ul>

            <ul
              v-if="current.sentences.length"
              :key="dictionaryData.sentence.length"
            >
              <li v-for="(it, i) in current.sentences" :key="i">
                <span
                  class="has-context"
                  :title="dictionaryData.sentence[it].reading[0]"
                  @click="(ev) => openContext(ev, it, 'sentence')"
                >
                  {{ it }}
                </span>
                <ul>
                  <li
                    v-for="(e, j) in dictionaryData.sentence[it].english"
                    :key="j"
                    class="english"
                  >
                    {{ e }}
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div v-else>
            <h2
              class="font-zh-simp text-w-normal has-context"
              :title="(current.reading || [])[0]"
              @click="openContext"
            >
              {{ current.entry }}
            </h2>

            <ul>
              <li v-for="(it, i) in current.english" :key="i">
                {{ it }}
              </li>
            </ul>
          </div>

          <div v-if="current.tag && current.tag.length" class="mb-4">
            Tags:
            <b-taglist style="display: inline-flex">
              <b-tag v-for="t in current.tag" :key="t" type="is-info">
                {{ t }}
              </b-tag>
            </b-taglist>
          </div>
        </div>
      </div>

      <div class="buttons-area">
        <div v-if="quizIndex >= quizArray.length" class="buttons">
          <button
            ref="btnEndQuiz"
            class="button is-warning"
            @click="endQuiz"
            @keypress="endQuiz"
          >
            End quiz
          </button>
        </div>
        <div v-else-if="!isQuizShownAnswer" class="buttons">
          <button
            ref="btnShowAnswer"
            class="button is-warning"
            @click="isQuizShownAnswer = true"
            @keypress="isQuizShownAnswer = true"
          >
            Show answer
          </button>
        </div>
        <div v-else class="buttons-panel">
          <div class="buttons">
            <button
              ref="btnMarkRight"
              class="button is-success"
              @click="doMark('right')"
              @keypress="doMark('right')"
            >
              Right
            </button>
            <button
              ref="btnMarkWrong"
              class="button is-danger"
              @click="doMark('wrong')"
              @keypress="doMark('wrong')"
            >
              Wrong
            </button>
            <button
              ref="btnMarkRepeat"
              class="button is-warning"
              @click="doMark('repeat')"
              @keypress="doMark('repeat')"
            >
              Repeat
            </button>
          </div>

          <div class="buttons">
            <button
              ref="btnHideAnswer"
              class="button is-warning"
              @click="isQuizShownAnswer = false"
              @keypress="isQuizShownAnswer = false"
            >
              Hide answer
            </button>
            <!-- <button
              ref="btnEditModal"
              class="button is-info"
              @click="openEditModal(quizCurrentId)"
              @keypress="openEditModal(quizCurrentId)"
            >
              Edit
            </button> -->
          </div>
        </div>
      </div>
    </div>

    <ContextMenu ref="context" :entry="ctxEntry" :type="ctxType" />
  </b-modal>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from 'vue-property-decorator'
import toPinyin from 'chinese-to-pinyin'
import ContextMenu from '../ContextMenu.vue'
import arrayShuffle from 'array-shuffle'

export type IQuizType = 'character' | 'vocabulary' | 'sentence'

export interface IQuizData {
  id: string
  type?: IQuizType
  direction?: string
  entry?: string
  nextReview?: string
  wrongStreak?: number
}

@Component({
  components: {
    ContextMenu,
  },
})
export default class QuizCard extends Vue {
  @Prop({ required: true }) quizArray!: string[]

  @Ref() context!: ContextMenu

  ctxEntry = ''
  ctxType = ''

  isQuizShownAnswer = false
  isQuizModal = false
  quizIndex = -1

  quizData: {
    [quizId: string]: IQuizData
  } = {}

  dictionaryData = {
    character: {} as Record<
      string,
      {
        reading: string[]
        english: string[]
        tag: string[]
      }
    >,
    vocabulary: {} as Record<
      string,
      {
        simplified: string
        alt: string[]
        reading: string[]
        english: string[]
        sentences: string[]
        tag: string[]
      }
    >,
    sentence: {} as Record<
      string,
      {
        reading: string[]
        english: string[]
        tag: string[]
      }
    >,
  }

  get current() {
    const it = this.quizData[this.quizArray[this.quizIndex]]

    if (!it || !it.type || !it.entry) {
      return {} as Partial<IQuizData>
    }

    return {
      ...it,
      ...this.dictionaryData[it.type][it.entry],
    }
  }

  getSentenceByCharacter(c: string) {
    return arrayShuffle(
      Object.entries(this.dictionaryData.sentence).filter(([entry]) =>
        entry.includes(c)
      )
    )
      .slice(0, 5)
      .map(([entry, v]) => ({
        ...v,
        entry,
      }))
  }

  async startQuiz() {
    this.quizIndex = -1
    await this.initNextQuizItem()
  }

  endQuiz() {
    this.isQuizModal = false
    this.$emit('quiz:ended')
  }

  async doMark(type: 'right' | 'wrong' | 'repeat') {
    const id = this.quizArray[this.quizIndex] as string | undefined

    if (id) {
      this.$axios.quizUpdateSrsLevel({
        id,
        dLevel: {
          right: 1,
          wrong: -1,
          repeat: 0,
        }[type],
      })
    }
    this.initNextQuizItem()
  }

  async initNextQuizItem() {
    this.isQuizShownAnswer = false

    Array(2)
      .fill(null)
      // eslint-disable-next-line array-callback-return
      .map((_, i) => {
        const front = this.checkFront(i + 1)

        if (!front) {
          this.cacheQuizItem({
            relativePosition: i + 1,
          })
        }
      })

    if (this.quizArray[this.quizIndex + 1]) {
      await this.cacheQuizItem({ relativePosition: 0 })
    }

    let it: IQuizData
    while (true) {
      it = this.quizData[this.quizArray[++this.quizIndex]]

      if (it && it.entry && it.type) {
        break
      }

      if (this.quizIndex >= this.quizArray.length) {
        break
      }
    }

    this.isQuizModal = true
  }

  checkFront(relativePosition: number): boolean {
    relativePosition++
    const it = this.quizData[this.quizArray[this.quizIndex + relativePosition]]

    if (!it) {
      return false
    }

    const { entry, type, direction } = it

    if (!entry || !type || !direction) {
      return false
    }

    return !!this.dictionaryData[type][entry]
  }

  openContext(ev: MouseEvent, entry?: string, type?: string) {
    this.ctxEntry = entry || this.current.entry || ''
    this.ctxType = type || this.current.type || ''

    this.context.open(ev)
  }

  doMask(s = '', ...ws: string[]) {
    // eslint-disable-next-line array-callback-return
    ws.map((w) => {
      s = s.replace(
        new RegExp(
          `(^| |[^a-z])(${w
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\d/g, '\\d?')
            .replace(/\s+/g, '\\s*')})($| |[^a-z])`,
          'gi'
        ),
        '$1<span class="gray-box">$2</span>$3'
      )
    })

    return s
  }

  async cacheQuizItem(params: { quizId?: string; relativePosition?: number }) {
    let { relativePosition = 0 } = params
    relativePosition++

    let { quizId } = params
    quizId = quizId || this.quizArray[this.quizIndex + relativePosition]

    if (!quizId) {
      return
    }

    let q = this.quizData[quizId]
    if (!q || !q.entry || !q.type || !q.direction) {
      const {
        data: {
          result: [r],
        },
      } = await this.$axios.quizGetMany(null, {
        id: [quizId],
        select: ['entry', 'type', 'direction'],
      })

      if (r) {
        if (q) {
          Object.assign(q, r)
        } else {
          q = {
            ...r,
            id: r.id!,
            type: r.type as IQuizType,
          }
        }

        q.id = quizId
        q.type = q.type as IQuizType
        q.entry = q.entry as string

        this.$set(this.quizData, quizId, q)
      }
    }

    const type = q.type as IQuizType
    const entry = q.entry

    if (!entry || !type) {
      return
    }

    if (!this.dictionaryData[type][entry]) {
      const setTemplate: {
        [type in IQuizType]: () => Promise<void>
      } = {
        character: async () => {
          const {
            data: { reading, english, tag },
          } = await this.$axios.characterGetByEntry({ entry })

          this.dictionaryData.character[entry] = {
            reading,
            english,
            tag,
          }

          this.$set(
            this.dictionaryData,
            'character',
            this.dictionaryData.character
          )

          if (this.getSentenceByCharacter(entry).length < 5) {
            const {
              data: { result },
            } = await this.$axios.characterSentence({ entry })
            result.map(({ entry, english }) => {
              if (!this.dictionaryData.sentence[entry]) {
                this.dictionaryData.sentence[entry] = {
                  reading: [
                    toPinyin(entry, {
                      keepRest: true,
                      toneToNumber: true,
                    }),
                  ],
                  english: [english],
                  tag: [],
                }
              }
            })

            this.$set(
              this.dictionaryData,
              'sentence',
              this.dictionaryData.sentence
            )
          }
        },
        vocabulary: async () => {
          const { simplified, alt, reading, english, tag } =
            this.dictionaryData.vocabulary[entry] ||
            (await this.$axios
              .vocabularyGetByEntry({ entry })
              .then(({ data }) => ({
                ...data,
                simplified: data.entry,
              })))

          this.dictionaryData.vocabulary[entry] = {
            simplified,
            alt,
            reading,
            english,
            sentences: [],
            tag,
          }

          this.$set(
            this.dictionaryData,
            'vocabulary',
            this.dictionaryData.vocabulary
          )

          {
            const {
              data: { result },
            } = await this.$axios.vocabularySentence({ entry })
            this.dictionaryData.vocabulary[entry].sentences = result.map(
              ({ entry, english }) => {
                if (!this.dictionaryData.sentence[entry]) {
                  this.dictionaryData.sentence[entry] = {
                    reading: [
                      toPinyin(entry, {
                        keepRest: true,
                        toneToNumber: true,
                      }),
                    ],
                    english: [english],
                    tag: [],
                  }
                }
                return entry
              }
            )

            this.$set(
              this.dictionaryData,
              'vocabulary',
              this.dictionaryData.vocabulary
            )
            this.$set(
              this.dictionaryData,
              'sentence',
              this.dictionaryData.sentence
            )
          }
        },
        sentence: async () => {
          await this.$axios
            .sentenceGetByEntry({
              entry,
            })
            .then(({ data: { english, tag } }) => {
              this.dictionaryData.sentence[entry] = {
                reading: [
                  toPinyin(entry, {
                    keepRest: true,
                    toneToNumber: true,
                  }),
                ],
                english,
                tag,
              }

              this.$set(
                this.dictionaryData,
                'sentence',
                this.dictionaryData.sentence
              )
            })
        },
      }

      await setTemplate[type]()
    }
  }
}
</script>

<style lang="scss" scoped>
.has-context {
  cursor: pointer;

  &:hover {
    color: blue;
  }
}

.traditional {
  & + &::before {
    content: ' | ';
    display: inline-block;
  }
}

.quiz-modal .modal-content {
  max-width: 500px !important;
}

.quiz-modal .buttons-area {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.buttons-area .buttons {
  margin-bottom: 0;
}

.quiz-modal .card-content {
  min-height: 7.5rem;
  max-height: calc(100vh - 300px);
  overflow: scroll;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  border-bottom: 1px solid hsla(0, 0%, 50%, 0.25);

  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */

  &::-webkit-scrollbar {
    width: 0px; /* For Chrome, Safari, and Opera */
  }
}

.buttons-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons-panel .buttons {
  margin-bottom: 0;
}

.buttons-area button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background-color: currentColor;
  visibility: hidden;
  z-index: 2;
}

.buttons-area button:not(:active)::before {
  animation: ripple 0.4s cubic-bezier(0, 0, 0.2, 1);
  transition: visibility 0.4s step-end;
}

.buttons-area button:active::before {
  visibility: visible;
}

.edit-modal .card-footer {
  padding: 1rem;
}

li.english:not(:hover) {
  color: white;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 150px;
    height: 150px;
    opacity: 0;
  }
}
</style>

<template>
  <section>
    <div class="SettingsPage">
      <form class="container" @submit.prevent="doSave">
        <div class="flex flex-row items-center">
          <b-field label="Level Range" class="flex-grow">
            <b-slider v-model="lv" :min="lvRange[0]" :max="lvRange[1]" lazy>
              <b-slider-tick :value="lvRange[0]">{{
                lvRange[0]
              }}</b-slider-tick>
              <template
                v-for="val in Array(lvRange[1] / 10)
                  .fill(10)
                  .map((el, i) => el * (i + 1))"
              >
                <b-slider-tick :key="val" :value="val">{{ val }}</b-slider-tick>
              </template>
            </b-slider>
          </b-field>
          <div class="label-level">{{ lv[0] }} - {{ lv[1] }}</div>
        </div>

        <div class="flex flex-row">
          <button class="button is-success" type="submit" aria-label="save">
            Save
          </button>
        </div>

        <div class="card has-background-danger-light mt-4">
          <div class="card-content">
            <h3 class="title is-3">Danger zone</h3>

            <b-button type="is-danger" @click="deleteUser">
              Delete user
            </b-button>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component<SettingsPage>({
  created() {
    this.$emit('title', 'Settings')
    const { settings } = this.$store.state

    this.lv = [
      settings.levelMin || this.lvRange[0],
      settings.level || this.lvRange[1],
    ]
  },
})
export default class SettingsPage extends Vue {
  readonly lvRange = [1, 60]
  readonly sentenceLengthRange = [2, 20]

  lv = this.clone(this.lvRange)
  sentenceLength = this.clone(this.sentenceLengthRange)

  get email() {
    // return this.$accessor.user || ''
    return this.$store.state.user
  }

  clone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o))
  }

  async doSave() {
    await this.$axios.userUpdateSettings(null, {
      level: this.lv[1],
      levelMin: this.lv[0],
    })

    this.$store.commit('SET_SETTINGS', {
      levelMin: this.lv[0],
      level: this.lv[1],
    })

    this.$buefy.snackbar.open('Saved')
  }

  deleteUser() {
    this.$buefy.dialog.confirm({
      message:
        'Do you want to delete yourself permanently? This cannot be undone.',
      onConfirm: async () => {
        await this.$axios.userDelete()
        this.$router.push('/')
      },
    })
  }
}
</script>

<style scoped>
.SettingsPage {
  padding-top: 1rem;
}

.SettingsPage > :not(.modal) {
  margin-bottom: 2rem;
}

.label-level {
  text-align: right;
  width: 5em;
  word-break: keep-all;
  margin-left: 1rem;
}
</style>

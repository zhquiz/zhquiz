<template>
  <section class="SettingsPage container">
    <b-field label="Level Range">
      <b-slider v-model="lv" :min="1" :max="60" ticks lazy />
    </b-field>
    <div class="level-label">{{ lv[0] }} - {{ lv[1] }}</div>

    <b-field>
      <button
        class="button is-success"
        :disabled="!user"
        @click="doSave"
        @keypress="doSave"
      >
        Save
      </button>
    </b-field>

    <b-loading :active="isLoading" />
  </section>
</template>

<script lang="ts">
import { User } from 'firebase/app'
import { Component, Vue, Watch } from 'nuxt-property-decorator'

@Component
export default class SettingsPage extends Vue {
  lv = [1, 60]
  isLoading = false

  get user() {
    const u = this.$store.state.user as User | null
    return u ? u.email : undefined
  }

  created() {
    this.onUserChanged()
  }

  @Watch('user')
  async onUserChanged() {
    if (this.user) {
      this.isLoading = true
      const { levelMin, level } = await this.$axios.$get('/api/user/')
      this.lv = [levelMin || 1, level || 60]
      this.isLoading = false
    }
  }

  async doSave() {
    if (this.user) {
      this.isLoading = true

      await this.$axios.$patch('/api/user/', {
        set: {
          levelMin: this.lv[0],
          level: this.lv[1],
        },
      })
      this.$buefy.snackbar.open('Saved')

      this.isLoading = false
    }
  }
}
</script>

<style scoped>
.SettingsPage {
  padding-top: 1rem;
}

.label-level {
  text-align: right;
  width: 100%;
  margin-right: 1rem;
}
</style>

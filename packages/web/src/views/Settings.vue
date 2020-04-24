<template lang="pug">
article#Settings.container
  .columns
    .column.is-11
      b-field(label="Level Range")
        b-slider(:min="1" :max="60" ticks v-model="lv" lazy)
    .column
      .label-level {{lv[0]}} - {{lv[1]}}
  b-field
    b-button(type="is-success" :disabled="!user" @click="doSave") Save
  b-loading(:active="isLoading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase, { User } from 'firebase/app'
import { AxiosInstance } from 'axios'

@Component
export default class Settings extends Vue {
  lv = [1, 60]
  isLoading = false

  get user () {
    const u = this.$store.state.user as User | null
    return u ? u.email : undefined
  }

  created () {
    this.onUserChanged()
  }

  async getApi (silent = true) {
    return await this.$store.dispatch('getApi', silent) as AxiosInstance
  }

  @Watch('user')
  async onUserChanged () {
    if (this.user) {
      this.isLoading = true
      const api = await this.getApi()
      const r = await api.get('/api/user/')
      const data = r.data
      this.lv = [data.levelMin || 1, data.level || 60]
      this.isLoading = false
    }
  }

  async doSave () {
    if (this.user) {
      this.isLoading = true
      const api = await this.getApi()

      await api.patch('/api/user/', {
        set: {
          levelMin: this.lv[0],
          level: this.lv[1]
        }
      })

      this.isLoading = false
    }
  }
}
</script>

<style lang="scss">
#Settings {
  padding-top: 1em;

  .label-level {
    text-align: right;
    width: 5em;
    margin-left: 1em;
    padding-top: 2em;
  }
}
</style>

<template lang="pug">
article#Settings.container
  b-field(label="Level")
    b-slider(:min="1" :max="60" ticks v-model="lv")
    .label-level {{lv}}
  b-field
    b-button(:disabled="!user" @click="doSave") Save
  b-loading(:active="isLoading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase, { User } from 'firebase/app'

import 'firebase/firebase-firestore'

@Component
export default class Settings extends Vue {
  lv = 0
  isLoading = false

  get user () {
    const u = this.$store.state.user as User | null
    return u ? u.email : undefined
  }

  mounted () {
    this.onUserChanged()
  }

  @Watch('user')
  async onUserChanged () {
    if (this.user) {
      this.isLoading = true

      const r = await firebase.firestore().collection('user').doc(this.user).get()
      this.lv = (r.data() || {}).level || 60

      this.isLoading = false
    }
  }

  async doSave () {
    if (this.user) {
      this.isLoading = true

      await firebase.firestore().collection('user').doc(this.user).set({
        level: this.lv
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
    width: 2em;
    margin-left: 1em;
  }
}
</style>

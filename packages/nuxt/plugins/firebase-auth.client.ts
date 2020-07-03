import { Plugin } from '@nuxt/types'

const onInit: Plugin = ({ app }) => {
  app.$fireAuth.onAuthStateChanged((user) => {
    if (app.store) {
      app.store.dispatch('updateUser', user)
    }
  })
}

export default onInit

import { Plugin } from '@nuxt/types'

const onInit: Plugin = ({ app }) => {
  app.$fireAuth.onAuthStateChanged((user) => {
    app.$accessor.updateUser(user)
  })
}

export default onInit

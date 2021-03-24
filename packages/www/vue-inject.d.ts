import { accessorType } from '~/store'
import { Client } from './types/openapi'

declare module 'vue/types/vue' {
  interface Vue {
    $accessor: typeof accessorType
    $axios: Client
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $accessor: typeof accessorType
    $axios: Client
  }
}

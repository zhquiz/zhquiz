import { accessorType } from '~/store'
import { AxiosInstance } from 'axios'

declare module 'vue/types/vue' {
  interface Vue {
    $accessor: typeof accessorType
    $axios: AxiosInstance
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $accessor: typeof accessorType
    $axios: AxiosInstance
  }
}

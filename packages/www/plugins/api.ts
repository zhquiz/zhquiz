import { Plugin } from '@nuxt/types'
import { Client } from '~/types/openapi'
import {
  LoadingProgrammatic as Loading,
  SnackbarProgrammatic as Snackbar,
} from 'buefy'
import { Magic } from 'magic-sdk'
import OpenAPIClientAxios from 'openapi-client-axios'

// eslint-disable-next-line import/no-mutable-exports
export let api: Client
export let magic: Magic | null = null

const apiClient = new OpenAPIClientAxios({
  definition: require('~/assets/openapi.json'),
  axiosConfigDefaults: {
    baseURL:
      typeof location !== 'undefined'
        ? location.origin
        : `http://localhost:${process.env.PORT}`,
  },
})

let loading: {
  close(): void
  requestEnded?: boolean
} | null = null
let requestTimeout: any = null

// eslint-disable-next-line require-await
const plugin: Plugin = async (_, inject) => {
  api = await apiClient.init()

  const {
    data: { csrf, magic: m },
  } = await api.settings()
  api.defaults.headers = api.defaults.headers || {}
  api.defaults.headers['CSRF-Token'] = csrf

  if (process.browser && m) {
    magic = new Magic(m)
  }

  api.interceptors.request.use((config) => {
    if (!loading) {
      if (requestTimeout) {
        clearTimeout(requestTimeout)
        requestTimeout = null
      }

      requestTimeout = setTimeout(() => {
        if (!loading) {
          loading = Loading.open({
            isFullPage: true,
            canCancel: true,
            onCancel: () => {
              if (loading && !loading.requestEnded) {
                Snackbar.open('API request is loading in background.')
              }
            },
          })
        }
      }, 5000)
    }

    return config
  })

  api.interceptors.response.use(
    (config) => {
      if (loading) {
        loading.requestEnded = true
        loading.close()
        loading = null
      }

      if (requestTimeout) {
        clearTimeout(requestTimeout)
        requestTimeout = null
      }

      return config
    },
    (err) => {
      if (loading) {
        loading.close()
        loading = null
      }

      if (requestTimeout) {
        clearTimeout(requestTimeout)
        requestTimeout = null
      }

      // eslint-disable-next-line no-console
      console.error(err)
      Snackbar.open(err.message)

      return err
    }
  )

  inject('axios', api)
}

export default plugin

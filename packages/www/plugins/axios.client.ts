import { Plugin } from '@nuxt/types'
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import {
  LoadingProgrammatic as Loading,
  SnackbarProgrammatic as Snackbar,
} from 'buefy'

function encodeURIMin(s: string) {
  s = (s || '').toString()

  const re = /(?![\x20-\x7F])[!,]/g
  const segs = s.match(re)
  if (segs) {
    return s
      .split(re)
      .map((s0, i) => encodeURIComponent(s0) + (segs[i] || ''))
      .join('')
  }

  return s
}

// eslint-disable-next-line import/no-mutable-exports
export let api: NuxtAxiosInstance

const plugin: Plugin = ({ $axios }) => {
  api = $axios

  $axios.defaults.paramsSerializer = (query: Record<string, unknown>) => {
    const q = Object.entries(query)
      .map(([k, v]) => {
        if (!v) {
          return ''
        }

        return `${encodeURIMin(k)}=${encodeURIMin(v as string)}`
      })
      .filter((s) => s)
      .join('&')

    return q
  }

  let loading: {
    close(): void
    requestEnded?: boolean
  } | null = null
  let requestTimeout: number | null = null

  $axios.interceptors.request.use((config) => {
    if (!loading) {
      if (requestTimeout) {
        clearTimeout(requestTimeout)
        requestTimeout = null
      }

      requestTimeout = window.setTimeout(() => {
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

  $axios.interceptors.response.use(
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
}

export default plugin

import axios from 'axios'
import {
  LoadingProgrammatic as Loading,
  SnackbarProgrammatic as Snackbar
} from 'buefy'

function encodeURIMin (s: string) {
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

const { searchParams } = new URL(location.href)

export const token = searchParams.get('token') || ''

export const api = axios.create({
  headers: {
    'CSRF-Token': token
  },
  paramsSerializer: (query: Record<string, unknown>) => {
    const q = Object.entries(query)
      .map(([k, v]) => {
        if (!v) {
          return
        }

        return `${encodeURIMin(k)}=${encodeURIMin(v as string)}`
      })
      .filter((s) => s)
      .join('&')

    return q
  }
})

let loading: {
  close(): void;
  requestEnded?: boolean;
} | null = null
let requestTimeout: number | null = null

api.interceptors.request.use(async (config) => {
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
          }
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
  async (err) => {
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

import { Plugin } from '@nuxt/types'
// @ts-ignore
import rison from 'rison-node'

const onInit: Plugin = ({ $axios }) => {
  $axios.defaults.paramsSerializer = (query: Record<string, any>) => {
    const q = Object.entries(query)
      .map(([k, v]) => {
        if (!v) {
          return
        }

        if (
          [
            'select',
            'sort',
            'type',
            'stage',
            'direction',
            'tag',
            'offset',
            'limit',
            'page',
            'perPage',
            'count',
            'level',
            'levelMin',
          ].includes(k) ||
          /^is[A-Z]/.test(k)
        ) {
          v = rison.encode(v)
        }

        return `${encodeURIMin(k)}=${encodeURIMin(v)}`
      })
      .filter((s) => s)
      .join('&')

    return q
  }
}

export default onInit

function encodeURIMin(s: string) {
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

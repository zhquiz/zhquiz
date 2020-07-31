import rison from 'rison-node'

export function parseQuery(q: any) {
  if (q && typeof q === 'object') {
    q = JSON.parse(JSON.stringify(q))
    Object.entries(q).map(([k, v]) => {
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
        q[k] = rison.decode(v)
      }
    })
  }

  return q
}

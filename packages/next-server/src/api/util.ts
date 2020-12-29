export function filterObjValue(obj: any, fn: (v: any) => boolean): any {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.filter((a) => fn(a)).map((a) => filterObjValue(a, fn))
    } else {
      return Object.entries(obj)
        .filter(([, v]) => fn(v))
        .map(([k, v]) => [k, filterObjValue(v, fn)])
        .reduce((prev, [k, v]) => ({ ...prev, [k]: v }), {})
    }
  }

  return obj
}

export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

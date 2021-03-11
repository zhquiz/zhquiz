/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
export function shuffle<T> (a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sample<T> (arr: T[], size: number): T[] {
  const allN = Array(arr.length)
    .fill(null)
    .map((_, i) => i)
  const outN: number[] = []

  while (allN.length && outN.length < size) {
    outN.push(...allN.splice(Math.floor(Math.random() * allN.length), 1))
  }

  return outN.map((n) => arr[n])
}

export function capitalize (s: string): string {
  if (s.includes(' ')) {
    return s
      .split(' ')
      .map((s0) => capitalize(s0))
      .join(' ')
  }

  return s[0].toLocaleUpperCase() + s.substr(1)
}

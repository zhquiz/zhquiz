/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
export function shuffle<T> (a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function capitalize (s: string): string {
  if (s.includes(' ')) {
    return s.split(' ').map(s0 => capitalize(s0)).join(' ')
  }

  return s[0].toLocaleUpperCase() + s.substr(1)
}

window.addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(ev.target.tagName.toLocaleUpperCase())) {
    return
  }

  if (ev.key === 's') {
    const s = window.getSelection()!.toString()
    if (s) {
      speak(s)
    }
  }
})

const allVoices: Record<string, string> = {}
speechSynthesis.getVoices().map(v => {
  allVoices[v.lang] = v.lang
})
speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices().map(v => {
    allVoices[v.lang] = v.lang
  })
}

export function speak (s: string, lang: string = 'zh') {
  const voices = Object.keys(allVoices)
  const stage1 = () => voices.filter((v) => v === lang)[0]
  const stage2 = () => {
    const m1 = lang.substr(0, 2)
    const m2 = lang.substr(3, 2)
    const r1 = new RegExp(`^${m1}[-_]${m2}`, 'i')
    return voices.filter((v) => r1.test(v))[0]
  }
  const stage3 = () => {
    const m1 = lang.substr(0, 2).toLocaleLowerCase()
    return voices.filter((v) => v.toLocaleLowerCase().startsWith(m1))[0]
  }

  lang = stage1() || stage2() || stage3() || ''

  if (lang) {
    const utterance = new SpeechSynthesisUtterance(s)
    utterance.lang = lang
    speechSynthesis.speak(utterance)
  }
}

export function humanizeDuration (duration: number) {
  if (!duration || typeof duration !== 'number' || duration < 0) {
    return ''
  }

  /**
   * @type {string[]}
   */
  const stack = []

  /**
   * ms
   */
  let div = divideAndRemainder(duration, 1000)
  duration = div.result

  /**
   * s
   */
  div = divideAndRemainder(duration, 60)
  duration = div.result
  stack.push(div.remainder ? `${div.remainder}s` : null)

  /**
   * min
   */
  div = divideAndRemainder(duration, 60)
  duration = div.result
  stack.push(div.remainder ? `${div.remainder}m` : null)

  /**
   * h
   */
  div = divideAndRemainder(duration, 24)
  duration = div.result
  stack.push(div.remainder ? `${div.remainder}h` : null)

  /**
   * d
   */
  div = divideAndRemainder(duration, 7)
  stack.push(div.remainder ? `${div.remainder}d` : null)

  /**
   * w
   */
  const w = div.result % 4
  stack.push(w ? `${w}w` : null)

  /**
   * mo
   */
  const mo = Math.floor(duration / 30) % 12
  stack.push(mo ? `${mo}mo` : null)

  /**
   * y
   */
  const y = Math.floor(duration / 365)
  stack.push(y ? `${y}y` : null)

  let j: number | null = null

  return stack
    .reverse()
    .filter((s, i) => {
      if (j === null && s !== null) {
        j = i
        return true
      }
      if (j !== null && i < j + 2) {
        return true
      }
      return false
    })
    .join(' ')
}

function divideAndRemainder (n: number, by: number) {
  return {
    result: Math.floor(n / by),
    remainder: n % by
  }
}

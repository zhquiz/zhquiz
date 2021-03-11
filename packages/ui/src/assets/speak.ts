import { token } from './api'

const allVoices: Record<string, string> = {}

// eslint-disable-next-line array-callback-return
speechSynthesis.getVoices().map((v) => {
  allVoices[v.lang] = v.lang
})

speechSynthesis.onvoiceschanged = () => {
  // eslint-disable-next-line array-callback-return
  speechSynthesis.getVoices().map((v) => {
    allVoices[v.lang] = v.lang
  })
}

export async function speak (s: string, forceOffline?: boolean) {
  if (!forceOffline && navigator.onLine) {
    const audio = new Audio(
      `/api/chinese/speak?q=${encodeURIComponent(s)}&token=${encodeURIComponent(
        token
      )}`
    )
    await audio.play().catch(() => speak(s, true))
    return
  }

  const voices = Object.keys(allVoices)
  const stage1 = () => voices.filter((v) => v === 'zh' || v === 'cmn')[0]
  const stage2 = () => {
    return voices.filter((v) => /^zh[-_]?/i.test(v))[0]
  }

  const lang = stage1() || stage2() || ''

  if (lang) {
    const utterance = new SpeechSynthesisUtterance(s)
    utterance.lang = lang
    speechSynthesis.speak(utterance)

    return new Promise<void>((resolve) => {
      utterance.onend = () => {
        resolve()
      }
    })
  }
}

window.addEventListener('keydown', (ev) => {
  if (
    ev.target instanceof HTMLElement &&
    ['INPUT', 'TEXTAREA'].includes(ev.target.tagName.toLocaleUpperCase())
  ) {
    return
  }

  if (ev.key === 's') {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const s = window.getSelection()!.toString()
    if (s) {
      speak(s)
    }
  }
})

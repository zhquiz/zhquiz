const allVoices: Record<string, string> = {}

export async function speak(s: string, forceOffline?: boolean) {
  if (!forceOffline && navigator.onLine) {
    const audio = new Audio(`/api/util/speak?q=${encodeURIComponent(s)}`)
    await audio.play().catch(() => speak(s, true))
    return
  }

  if (Object.keys(allVoices).length === 0) {
    // eslint-disable-next-line array-callback-return
    window.speechSynthesis.getVoices().map((v) => {
      allVoices[v.lang] = v.lang
    })

    window.speechSynthesis.onvoiceschanged = () => {
      // eslint-disable-next-line array-callback-return
      window.speechSynthesis.getVoices().map((v) => {
        allVoices[v.lang] = v.lang
      })
    }
  }

  const voices = Object.keys(allVoices)
  const stage1 = () => voices.filter((v) => v === 'zh' || v === 'cmn')[0]
  const stage2 = () => {
    return voices.filter((v) => /^zh[-_]?/i.test(v))[0]
  }

  const lang = stage1() || stage2() || ''

  if (lang) {
    const utterance = new window.SpeechSynthesisUtterance(s)
    utterance.lang = lang
    window.speechSynthesis.speak(utterance)

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

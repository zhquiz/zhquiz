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

export async function speak(s: string, forceOffline?: boolean) {
  if (!forceOffline) {
    const audio = new Audio(`/api/util/speak?q=${encodeURIComponent(s)}`)
    await audio.play().catch(() => speak(s, true))
    return
  }

  let lang = 'zh'

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

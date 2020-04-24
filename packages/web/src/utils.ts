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

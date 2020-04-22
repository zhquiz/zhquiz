import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://zhres.herokuapp.com'
})

export function speak (s: string, lang: string = 'zh') {
  const rate = 1

  const allVoices = speechSynthesis.getVoices()
  let vs = allVoices.filter((v) => v.lang === lang)
  if (vs.length === 0) {
    const m1 = lang.substr(0, 2)
    const m2 = lang.substr(3, 2)
    const r1 = new RegExp(`^${m1}[-_]${m2}`, 'i')

    vs = allVoices.filter((v) => r1.test(v.lang))
    if (vs.length === 0) {
      const r2 = new RegExp(`^${m1}`, 'i')
      vs = allVoices.filter((v) => r2.test(v.lang))
    }
  }

  if (vs.length > 0) {
    const utterance = new SpeechSynthesisUtterance(s)
    utterance.lang = vs[0].lang
    utterance.rate = rate
    speechSynthesis.speak(utterance)
  }
}

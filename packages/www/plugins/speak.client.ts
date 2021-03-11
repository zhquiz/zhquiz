import { speak } from '~/assets/speak'

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

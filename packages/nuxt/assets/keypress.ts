export const doClick = async (el?: Element | null, timeout?: number) => {
  if (!el) return

  if (el.classList?.add) {
    el.classList.add('active')
  }

  const { click } = el as any
  if (typeof click === 'function') {
    const r = click()
    if (r instanceof Promise) {
      await r
    } else if (timeout) {
      await new Promise((resolve) => setTimeout(resolve, timeout))
    } else {
      return
    }
  }

  if (el.classList?.remove) {
    el.classList.remove('active')
  }
}

export const doMapKeypress = (
  evt: KeyboardEvent,
  map: Record<string, (() => any) | string | HTMLElement>
) => {
  let action = map[evt.key]
  while (typeof action === 'string') {
    action = map[action]
  }
  if (typeof action === 'function') {
    action()
  } else if (action instanceof HTMLElement) {
    doClick(action)
  }
}

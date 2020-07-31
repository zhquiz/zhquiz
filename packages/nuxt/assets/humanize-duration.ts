export function humanizeDuration(duration: number) {
  if (!duration || typeof duration !== 'number' || duration < 0) {
    return ''
  }

  const stack: (string | null)[] = []

  /**
   * ms => s => min
   */
  {
    const div = divideAndRemainder(duration, 60 * 60 * 1000)
    duration = div.result

    /**
     * Remainder is also in milliseconds
     */
    const remRound = Math.round(div.remainder / (60 * 1000))
    stack.push(remRound ? `${remRound}m` : null)
  }

  /**
   * h
   */
  {
    const div = divideAndRemainder(duration, 24)
    duration = div.result
    stack.push(div.remainder ? `${div.remainder}h` : null)
  }

  /**
   * d
   */
  const div = divideAndRemainder(duration, 7)
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

function divideAndRemainder(n: number, by: number) {
  return {
    result: Math.floor(n / by),
    remainder: n % by,
  }
}

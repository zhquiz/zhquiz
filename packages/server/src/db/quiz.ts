import dayjs from 'dayjs'

export const srsMap = [
  durationOf(4, 'hour'),
  durationOf(8, 'hour'),
  durationOf(1, 'day'),
  durationOf(3, 'day'),
  durationOf(1, 'week'),
  durationOf(2, 'week'),
  durationOf(4, 'week'),
  durationOf(16, 'week'),
]

export function getNextReview(srsLevel: number): Date {
  let toAdd = srsMap[srsLevel]
  toAdd = toAdd === undefined ? durationOf(10, 'minute') : toAdd
  return dayjs().add(toAdd, 'hour').toDate()
}

export function repeatReview(): Date {
  return dayjs().add(10, 'minute').toDate()
}

type DurationUnit = 'minute' | 'hour' | 'day' | 'week'

/**
 * In hours
 *
 * @param n
 * @param unit
 */
export function durationOf(n: number, unit: DurationUnit) {
  const factor = {
    minute: 1 / 60,
    hour: 1,
    day: 24,
    week: 24 * 7,
  }[unit]

  if (factor) {
    return factor * n
  }

  throw new Error(`Unit ${unit} isn't available`)
}

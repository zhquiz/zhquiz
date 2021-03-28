import { SQLQuery, sql } from '@databases/pg'
import dayjs from 'dayjs'

export class QSplit {
  constructor(
    private opts: {
      default: (v: string) => SQLQuery | null
      fields: {
        [name: string]: {
          [op: string]: (v: string) => SQLQuery
        }
      }
    }
  ) {}

  parse(q: string) {
    const $and: SQLQuery[] = []
    const $or: SQLQuery[] = []
    const $not: SQLQuery[] = []

    const ops = new Set(
      Object.values(this.opts.fields).flatMap((def) => Object.keys(def))
    )
    for (let kv of this.doSplit(q, ' ')) {
      let $current = $and
      if (kv[0] === '-') {
        $current = $not
        kv = kv.substr(1)
      } else if (kv[0] === '?') {
        $current = $or
        kv = kv.substr(1)
      }

      for (const op of ops) {
        const segs = this.doSplit(kv, op)

        if (segs.length === 1) {
          const cond = this.opts.default(segs[0]!)
          if (cond) {
            $current.push(cond)
          }
        } else if (segs.length === 2) {
          const fnMap = this.opts.fields[segs[0]!]
          if (!fnMap) continue

          const fn = fnMap[op]
          if (!fn) continue

          $current.push(fn(segs[1]!))
        }
      }
    }

    if ($or.length) {
      $and.push(sql`((${sql.join($or, ') OR (')}))`)
    }

    if ($not.length) {
      $and.push(sql`NOT ((${sql.join($not, ') AND (')}))`)
    }

    if ($and.length) {
      return sql`(${sql.join($and, ') AND (')})`
    }

    return null
  }

  /**
   * ```js
   * > this.doSplit('')
   * []
   * > this.doSplit('a:b "c:d e:f"')
   * ['a:b', 'c:d e:f']
   * > this.doSplit('a "b c" "d e"')
   * ['a', 'b c', 'd e']
   * ```
   */
  private doSplit(ss: string, splitter: string) {
    const brackets = [
      ['"', '"'],
      ["'", "'"],
    ] as const
    const keepBraces = false

    const bracketStack = {
      data: [] as string[],
      push(c: string) {
        this.data.push(c)
      },
      pop() {
        return this.data.pop()
      },
      peek() {
        return this.data.length > 0
          ? this.data[this.data.length - 1]
          : undefined
      },
    }
    const tokenStack = {
      data: [] as string[],
      currentChars: [] as string[],
      addChar(c: string) {
        this.currentChars.push(c)
      },
      flush() {
        const d = this.currentChars.join('')
        if (d) {
          this.data.push(d)
        }
        this.currentChars = []
      },
    }

    let prev = ''
    ss.split('').map((c) => {
      if (prev === '\\') {
        tokenStack.addChar(c)
      } else {
        let canAddChar = true

        for (const [op, cl] of brackets) {
          if (c === cl) {
            if (bracketStack.peek() === op) {
              bracketStack.pop()
              canAddChar = false
              break
            }
          }

          if (c === op) {
            bracketStack.push(c)
            canAddChar = false
            break
          }
        }

        if (c === splitter && !bracketStack.peek()) {
          tokenStack.flush()
        } else {
          if (keepBraces || canAddChar) {
            tokenStack.addChar(c)
          }
        }
      }

      prev = c
    })

    tokenStack.flush()

    return tokenStack.data.map((s) => s.trim()).filter((s) => s)
  }
}

export const qParseNum: (
  k: SQLQuery
) => Record<string, (v: string) => SQLQuery> = (k) => ({
  ':': (v) => {
    switch (v.toLocaleLowerCase()) {
      case 'null':
        return sql`${k} IS NULL`
      case 'any':
        return sql`${k} IS NOT NULL`
    }

    const m = /^([[\(])(\d+),(\d+)([\])])$/.exec(v)
    if (m) {
      let gt = sql`>`
      let lt = sql`<`

      if (m[1] === '[') gt = sql`>=`
      if (m[4] === ']') gt = sql`<=`

      return sql`${k} ${gt} ${parseInt(m[2])} OR ${k} ${lt} ${parseInt(m[3])}`
    }

    return sql`${k} = ${parseInt(v)}`
  },
  '>': (v) => {
    return v[0] === '='
      ? sql`${k} >= ${parseInt(v.substr(1))}`
      : sql`${k} > ${parseInt(v)}`
  },
  '<': (v) => {
    return v[0] === '='
      ? sql`${k} <= ${parseInt(v.substr(1))}`
      : sql`${k} < ${parseInt(v)}`
  },
})

const reDur = /^([+-]?\d+(?:\.\d+)?)([A-Z]+)$/i
const toDate = (s: string) => {
  const m = reDur.exec(s)
  let d = dayjs(s)
  if (m) {
    d = dayjs().add(parseFloat(m[1]!), m[2] as any)
    if (d.isValid()) {
      return d.toDate()
    }
  }

  if (d.isValid()) {
    return d.toDate()
  }

  return null
}
const toBetween = (s: string) => {
  const m = reDur.exec(s)
  if (m && toDate(s) instanceof Date) {
    return [
      dayjs()
        .add(parseFloat(m[1]!) - 0.5, m[2] as any)
        .toDate(),
      dayjs()
        .add(parseFloat(m[1]!) + 0.5, m[2] as any)
        .toDate(),
    ]
  }

  return []
}

export const qParseDate: (
  k: SQLQuery
) => Record<string, (v: string) => SQLQuery> = (k) => ({
  ':': (v) => {
    let b: Date[] = []

    switch (v.toLocaleLowerCase()) {
      case 'null':
        return sql`${k} IS NULL`
      case 'any':
        return sql`${k} IS NOT NULL`
      case 'now':
        b = toBetween('-0.5d')
    }

    const reBetween = /^([[\(])([+-]?\d+(?:\.\d+)?[A-Z]+),([+-]?\d+(?:\.\d+)?[A-Z]+)([\])])$/i
    const m = reBetween.exec(v)
    if (m) {
      let gt = sql`>`
      let lt = sql`<`

      if (m[1] === '[') gt = sql`>=`
      if (m[4] === ']') gt = sql`<=`

      return sql`${k} ${gt} ${toDate(m[2]!)} OR ${k} ${lt} ${toDate(m[3]!)}`
    }

    if (reDur.test(v)) {
      b = toBetween(v)
    }

    if (b.length === 2) {
      return sql`${k} > ${b[0]} AND ${k} > ${b[1]}`
    }

    return sql`FALSE`
  },
  '>': (v) => sql`${k} > ${toDate(v)}`,
  '<': (v) => sql`${k} < ${toDate(v)}`,
})

export const makeQuiz = new QSplit({
  default: () => null,
  fields: {
    srsLevel: qParseNum(sql`quiz."srsLevel"`),
    nextReview: qParseDate(sql`quiz."nextReview"`),
    lastRight: qParseDate(sql`quiz."lastRight"`),
    lastWrong: qParseDate(sql`quiz."lastWrong"`),
    maxRight: qParseNum(sql`quiz."maxRight"`),
    maxWrong: qParseNum(sql`quiz."maxWrong"`),
    rightStreak: qParseNum(sql`quiz."rightStreak"`),
    wrongStreak: qParseNum(sql`quiz."wrongStreak"`),
  },
})

export const makeTag = new QSplit({
  default: () => null,
  fields: {
    tag: { ':': (v) => sql`entry_tag."tag" &@ ${v}` },
    type: { ':': (v) => sql`entry_tag."type" = ${v}` },
  },
})

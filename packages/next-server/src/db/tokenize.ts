export interface ISplitOptions {
  brackets: [string, string][]
  split: string
  escape: string
}

export const defaultSplitOptions: ISplitOptions = {
  brackets: [
    ['"', '"'],
    ["'", "'"],
    ['(', ')']
  ],
  split: ' ',
  escape: '\\'
}

/**
 *
 * @param ss
 * @param options
 *
 * ```js
 * > split('')
 * []
 * > split('a:b "c:d e:f"')
 * ['a:b', 'c:d e:f']
 * > split('a "b c" "d e"')
 * ['a', 'b c', 'd e']
 * ```
 */
export function split(
  ss: string,
  options: ISplitOptions = defaultSplitOptions
) {
  const bracketStack = {
    data: [] as string[],
    push(c: string) {
      this.data.push(c)
    },
    pop() {
      return this.data.pop()
    },
    peek() {
      return this.data.length > 0 ? this.data[this.data.length - 1] : undefined
    }
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
    }
  }

  let prev = ''
  ss.split('').map((c) => {
    if (prev === options.escape) {
      tokenStack.addChar(c)
    } else {
      for (const [op, cl] of options.brackets) {
        if (c === cl) {
          if (bracketStack.peek() === op) {
            bracketStack.pop()
            break
          }
        }

        if (c === op) {
          bracketStack.push(c)
          break
        }
      }

      if (c === options.split && !bracketStack.peek()) {
        tokenStack.flush()
      } else {
        tokenStack.addChar(c)
      }
    }

    prev = c
  })

  tokenStack.flush()

  return tokenStack.data.map((s) => s.trim()).filter((s) => s)
}

export interface ISplitOpToken {
  prefix?: string
  k?: string
  op?: string
  v: string
}

/**
 *
 * @param ss
 *
 * ```js
 * > splitOp('a:b -c:"d e"')
 * [{"k": "a", "op": ":", "prefix": undefined, "v": "b"}, {"k": "c", "op": ":", "prefix": "-", "v": "d e"}]
 * ```
 */
export function splitOp(ss: string) {
  const data = split(
    ss,
    Object.assign({ keepBrace: true }, defaultSplitOptions)
  )
  const output: ISplitOpToken[] = []

  data.map((d) => {
    // eslint-disable-next-line no-useless-escape
    const m = /^(?<prefix>[\-+])?(?<k>[^:><]+)(?<op>[:><=]{1,2})(?<v>.+)$/i.exec(
      d
    )
    if (m && m.groups) {
      output.push({
        prefix: m.groups.prefix,
        k: m.groups.k,
        op: m.groups.op,
        v: removeBraces(m.groups.v)
      })
    } else {
      output.push({
        v: removeBraces(d)
      })
    }
  })

  return output
}

export function removeBraces(ss: string) {
  if (ss.length >= 2) {
    for (const [op, cl] of defaultSplitOptions.brackets) {
      if (op === ss[0] && cl === ss[ss.length - 1]) {
        return ss.substr(1, ss.length - 2)
      }
    }
  }

  return ss
}

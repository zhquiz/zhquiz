import DOMPurify from 'dompurify'
import HyperPug from 'hyperpug'
import MarkdownIt from 'markdown-it'
import hbs from 'handlebars'

hbs.registerHelper('join', function (ctx, w) {
  if (Array.isArray(ctx) && typeof w === 'string') {
    return new hbs.SafeString(ctx.join(hbs.escapeExpression(w)))
  }

  return new hbs.SafeString(hbs.escapeExpression(ctx))
})

hbs.registerHelper('mask', function (ctx, ...ws) {
  let base = hbs.escapeExpression(ctx)

  const doReplace = (w: string) => {
    base = base.replace(
      new RegExp(
        `(^| |[^a-z])(${hbs
          .escapeExpression(w)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\d/g, '\\d?')
          .replace(/\s+/g, '\\s*')})($| |[^a-z])`,
        'gi'
      ),
      '$1<span class="gray-box">$2</span>$3'
    )
  }

  ws.map((w) => {
    if (Array.isArray(w)) {
      w.map((w0) => {
        doReplace(w0)
      })
    } else if (typeof w === 'string') {
      doReplace(w)
    }
  })

  return new hbs.SafeString(base)
})

export class MakeHtml {
  md: MarkdownIt
  hp: HyperPug

  html = ''

  constructor(public id = Math.random().toString(36)) {
    this.id = 'el-' + hashFnv32a(this.id)
    this.md = MarkdownIt({
      breaks: true,
      html: true,
    })
      .use((md) => {
        const { fence } = md.renderer.rules

        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
          const token = tokens[idx]
          const info = token.info.trim()
          const content = token.content

          if (info === 'pug parsed') {
            return this._pugConvert(content)
          }

          return fence!(tokens, idx, options, env, slf)
        }
        return md
      })

    this.hp = new HyperPug({
      markdown: (s: string) => this._mdConvert(s),
    })
  }

  /**
   * This should be the only method that requires browser
   */
  render(s: string, safe?: boolean) {
    try {
      if (s.startsWith('---\n')) {
        s = s.substr(4).split(/---\n(.*)$/s)[1] || ''
      }

      this.html = this._mdConvert(s)
    } catch (e) {}

    const body = document.createElement('body')
    if (safe) {
      body.innerHTML = DOMPurify.sanitize(this.html, {
        ADD_TAGS: ['style', 'x-card'],
      })
    } else {
      body.innerHTML = this.html
    }

    return `<div class="${this.id}">${body.innerHTML}</div>`
  }

  private _pugConvert(s: string) {
    return this.hp.parse(s)
  }

  private _mdConvert(s: string) {
    return this.md.render(s)
  }
}

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {string}
 */
function hashFnv32a(str: string, seed?: number): string {
  /* jshint bitwise:false */
  var i
  var l
  var hval = seed === undefined ? 0x811c9dc5 : seed

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }

  return (hval >>> 0).toString(36)
}

function getIndent(s: string) {
  const indents: number[] = []
  for (const r of s.split(/\r?\n/g)) {
    if (r.trim()) {
      const m = /^ +/.exec(r)
      if (m) {
        indents.push(m[0].length)
      }
    }
  }

  return indents.length ? Math.min(...indents) : 0
}

export function stripIndent(s: string, indent = getIndent(s)) {
  console.log(s)

  return s
    .split('\n')
    .map((r) => r.replace(new RegExp(`^ {1,${indent}}`), ''))
    .join('\n')
}

const makeHtml = new MakeHtml()

export function markdownToHtml(s: string, ctx?: any) {
  const unsafe = makeHtml.render(hbs.compile(s)(ctx))
  return DOMPurify.sanitize(unsafe, { ADD_TAGS: ['x-speak-button'] })
}

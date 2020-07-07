import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import DOMPurify from 'dompurify'
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

const makeHtml = new MakeHtml()

export function markdownToHtml(s: string, ctx?: any) {
  const unsafe = makeHtml.render(hbs.compile(s)(ctx))
  return DOMPurify.sanitize(unsafe, { ADD_TAGS: ['x-speak-button'] })
}

import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import DOMPurify from 'dompurify'
import hbs from 'handlebars'

hbs.registerHelper('mask', function (ctx, ...ws) {
  let base = hbs.escapeExpression(ctx)

  ws.map((w) => {
    if (Array.isArray(w)) {
      w.map((w0) => {
        base = base.replace(
          new RegExp(
            hbs
              .escapeExpression(w0)
              .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              .replace(/\d/g, '\\d?'),
            'gi'
          ),
          '<span class="gray-box">$&</span>'
        )
      })
    } else if (typeof w === 'string') {
      base = base.replace(
        new RegExp(
          hbs
            .escapeExpression(w)
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\d/g, '\\d'),
          'gi'
        ),
        '<span class="gray-box">$&</span>'
      )
    }
  })

  return new hbs.SafeString(base)
})

const makeHtml = new MakeHtml()

export function markdownToHtml(s: string, ctx?: any) {
  const unsafe = makeHtml.render(hbs.compile(s)(ctx))
  return DOMPurify.sanitize(unsafe, { ADD_TAGS: ['x-speak-button'] })
}

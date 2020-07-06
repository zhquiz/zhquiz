import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import DOMPurify from 'dompurify'
import hbs from 'handlebars'
import he from 'he'

hbs.registerHelper('speak', (s: string) => {
  return `<x-speak-button data-s="${he.encode(s)}"></x-speak-button>`
})

const makeHtml = new MakeHtml()

export function markdownToHtml(s: string, ctx?: any) {
  const unsafe = makeHtml.render(hbs.compile(s)(ctx))
  return DOMPurify.sanitize(unsafe, { ADD_TAGS: ['x-speak-button'] })
}

import DOMPurify from 'dompurify'
import hbs from 'handlebars'
import he from 'he'
import MarkdownIt from 'markdown-it'
import MdItEmoji from 'markdown-it-emoji'

hbs.registerHelper('speak', (s: string) => {
  return `<x-speak-button data-s="${he.encode(s)}"/>`
})

const markdownIt = MarkdownIt({
  html: true,
}).use(MdItEmoji)

export function markdownToHtml(s: string, ctx?: any) {
  const unsafe = markdownIt.render(hbs.compile(s)(ctx))
  return DOMPurify.sanitize(unsafe, { ADD_TAGS: ['x-speak-button'] })
}

import MarkdownIt from 'markdown-it'
import MdItEmoji from 'markdown-it-emoji'
import DOMPurify from 'dompurify'
import hbs from 'handlebars'

hbs.registerHelper('speak', (s: string) => {
  return `<iframe src="https://speak-btn.now.sh/btn?q=${encodeURIComponent(s)}&lang=zh" style="width: 20px; height: 20px;" frameborder="0" allowtransparency="true"></iframe>`
})

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const src = node.getAttribute('src') || ''
    if (!src.startsWith('https://speak-btn.now.sh/btn?')) {
      return node.parentNode?.removeChild(node)
    }
  }
})

const markdownIt = MarkdownIt({
  html: true
}).use(MdItEmoji)

export function markdownToHtml (s: string, ctx?: any) {
  const unsafe = markdownIt.render(hbs.compile(s)(ctx))
  return DOMPurify.sanitize(unsafe, { ADD_TAGS: ['iframe'] })
}

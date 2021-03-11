/* eslint-disable no-new */
/* eslint-disable @typescript-eslint/no-use-before-define */
import 'buefy/dist/buefy.css'

import './etabs.scss'

declare global {
  interface Window {
    openExternal?: (url: string) => void;
    setName: (id: number, name: string) => void;
  }
}

const tabEl = document.querySelector('nav > ul') as HTMLUListElement
const mainEl = document.querySelector('main') as HTMLElement
let plusEl = createPlusEl()

function createPlusEl () {
  const li = document.createElement('li')
  plusEl = li

  const liA = document.createElement('a')
  liA.innerText = '+'
  liA.setAttribute('role', 'button')
  liA.onclick = () => {
    new Tab({ isPlus: true })
  }

  li.append(liA)
  tabEl.append(li)

  return li
}

const originalOpen = window.open
window.open = function (url) {
  return new Tab({ url }).iframeElement?.contentWindow || null
}

const tabList: Tab[] = []

window.setName = function (id, name) {
  const t = tabList[id]
  if (t) {
    t.titleElement.innerText = name
  }
}

class Tab {
  url: string
  titleElement!: HTMLSpanElement
  iframeElement!: HTMLIFrameElement

  constructor (
    opts: {
      url?: string;
      permanent?: boolean;
      isPlus?: boolean;
    } = {}
  ) {
    if (plusEl && !opts.isPlus) {
      plusEl.remove()
    }

    const url = opts.url || '/#/'
    this.url = url

    /**
     * 1. Divert external
     */
    if (!url.startsWith('/#/')) {
      if (window.openExternal) {
        window.openExternal(url)
        return
      }

      originalOpen(url, '_blank', 'noopener noreferrer')
      return
    }

    /**
     * 2. Deactivate
     */
    tabEl.querySelectorAll('li').forEach((el) => {
      el.classList.remove('is-active')
    })

    /**
     * 3. Add tab
     */
    tabEl.append(
      (() => {
        const li = opts.isPlus ? plusEl : document.createElement('li')
        li.textContent = ''

        li.className = 'is-active'

        const liA = document.createElement('a')
        li.append(liA)

        this.titleElement = document.createElement('span')

        this.titleElement.innerHTML = /* html */ `
        <div class="loading">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </div>
        `

        liA.append(this.titleElement)

        liA.setAttribute('role', 'button')
        liA.onclick = () => {
          const index = Array.from(tabEl.querySelectorAll('li > a')).indexOf(
            liA
          )

          tabEl.querySelectorAll('li').forEach((el, i) => {
            if (i !== index) {
              el.classList.remove('is-active')
            } else {
              el.classList.add('is-active')
            }
          })

          mainEl.querySelectorAll('iframe').forEach((el, i) => {
            if (i !== index) {
              el.style.display = 'none'
            } else {
              el.style.display = 'block'
            }
          })
        }

        if (!opts.permanent) {
          const liAClose = document.createElement('a')
          liAClose.className = 'delete is-small'
          liAClose.onclick = () => {
            let i = Array.from(tabEl.querySelectorAll('li > a')).indexOf(liA)
            if (i < 1) {
              return
            }

            const li = Array.from(tabEl.querySelectorAll('li'))[i]
            if (li.classList.contains('is-active')) {
              setTimeout(() => {
                i--

                Array.from(tabEl.querySelectorAll('li'))[i].classList.add(
                  'is-active'
                )
                Array.from(mainEl.querySelectorAll('iframe'))[i].style.display =
                  ''
              }, 10)
            }

            li.remove()

            const iframe = Array.from(mainEl.querySelectorAll('iframe'))[i]
            iframe.remove()
          }

          liA.append(liAClose)
        }

        return li
      })()
    )

    /**
     * 4. Add plus
     */
    createPlusEl()

    /**
     * 5. Show iframe
     */
    const iframe = document.createElement('iframe')
    iframe.src = url
    iframe.setAttribute('data-id', tabList.length.toString())

    this.iframeElement = iframe

    mainEl.querySelectorAll('iframe').forEach((el) => {
      el.style.display = 'none'
    })

    mainEl.append(iframe)

    tabList.push(this)
  }
}

new Tab({ permanent: true })

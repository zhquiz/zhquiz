import he from 'he'

import { speak } from '~/assets/speak'

customElements.define(
  'x-speak-button',
  class extends HTMLElement {
    isSpeaking = false
    aEl: HTMLAnchorElement | null = null

    get s() {
      return this.innerHTML.trim()
    }

    constructor() {
      super()

      if (this.s) {
        const shadow = this.attachShadow({ mode: 'open' })
        this.aEl = document.createElement('a')
        this.aEl.setAttribute('role', 'button')
        this.aEl.className = 'x-speak-button'

        const imgEl = document.createElement('img')
        imgEl.src = '/svg/volume-up-solid.svg'

        this.aEl.appendChild(imgEl)

        this.aEl.onclick = () => {
          this.click()
        }

        const style = document.createElement('style')
        style.textContent = /* css */ `
        a.x-speak-button {
          background-color: #ffeaa7;
          border: none;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 1rem;
          width: 1rem;
          cursor: pointer;
        }

        a.x-speak-button img {
          height: 0.8rem;
          width: 0.8rem;
        }

        a.x-speak-button.active {
          background-color: #81ecec;
        }
        `

        shadow.appendChild(style)
        shadow.appendChild(this.aEl)
      }
    }

    async click() {
      if (!this.s || !this.aEl || this.isSpeaking) {
        return
      }

      this.isSpeaking = true
      this.aEl.classList.add('active')
      await speak(he.decode(this.s))
      this.aEl.classList.remove('active')
      this.isSpeaking = false
    }
  }
)

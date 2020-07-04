import { speak } from '~/assets/speak'

customElements.define(
  'x-speak-button',
  class extends HTMLElement {
    constructor() {
      super()

      const s = this.getAttribute('data-s')
      if (s) {
        const shadow = this.attachShadow({ mode: 'open' })
        const aEl = document.createElement('a')
        aEl.setAttribute('role', 'button')
        aEl.className = 'x-speak-button'

        const imgEl = document.createElement('img')
        imgEl.src = '/svg/volume-up-solid.svg'

        aEl.appendChild(imgEl)

        let isSpeaking = false

        aEl.onclick = async () => {
          if (isSpeaking) {
            return
          }

          isSpeaking = true
          aEl.classList.add('active')
          await speak(s)
          aEl.classList.remove('active')
          isSpeaking = false
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
        shadow.appendChild(aEl)
      }
    }
  }
)

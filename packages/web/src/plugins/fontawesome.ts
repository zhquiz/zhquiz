import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch, faCaretDown, faCaretUp,
  faTag, faExclamationCircle,
  faAngleLeft, faAngleRight, faAngleUp, faArrowUp
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faSearch, faCaretDown, faCaretUp,
  faTag, faExclamationCircle,
  faAngleLeft, faAngleRight, faAngleUp, faArrowUp
)

Vue.component('fontawesome', FontAwesomeIcon)

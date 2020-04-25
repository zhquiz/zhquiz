import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch, faCaretDown, faCaretUp,
  faTag, faExclamationCircle, faInfoCircle, faExclamationTriangle,
  faAngleLeft, faAngleRight, faAngleUp, faArrowUp,
  faEyeSlash, faEye
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faSearch, faCaretDown, faCaretUp,
  faTag, faExclamationCircle, faInfoCircle, faExclamationTriangle,
  faAngleLeft, faAngleRight, faAngleUp, faArrowUp,
  faEyeSlash, faEye
)

Vue.component('fontawesome', FontAwesomeIcon)

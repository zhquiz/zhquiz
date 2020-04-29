import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch, faCaretDown, faCaretUp,
  faTag, faExclamationCircle, faInfoCircle, faExclamationTriangle,
  faRandom,
  faAngleLeft, faAngleRight, faAngleUp, faArrowUp,
  faEyeSlash, faEye, faQuestionCircle, faFolderPlus, faCog
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faSearch, faCaretDown, faCaretUp,
  faTag, faExclamationCircle, faInfoCircle, faExclamationTriangle,
  faRandom, faQuestionCircle, faFolderPlus, faCog,
  faAngleLeft, faAngleRight, faAngleUp, faArrowUp,
  faEyeSlash, faEye,
  faGithub, faGoogle
)

Vue.component('fontawesome', FontAwesomeIcon)

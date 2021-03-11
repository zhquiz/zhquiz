import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faArrowUp,
  faBookReader,
  faCaretDown,
  faCaretUp,
  faChalkboardTeacher,
  faCog,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faInfoCircle,
  faRandom,
  faSearch,
  faTag,
  faUserEdit
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Vue from 'vue'

library.add(
  faSearch,
  faCaretDown,
  faCaretUp,
  faTag,
  faExclamationCircle,
  faInfoCircle,
  faExclamationTriangle,
  faRandom,
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faArrowUp,
  faEyeSlash,
  faEye,
  faCog,
  faBookReader,
  faUserEdit,
  faChalkboardTeacher,
  faGithub
)

Vue.component('fontawesome', FontAwesomeIcon)

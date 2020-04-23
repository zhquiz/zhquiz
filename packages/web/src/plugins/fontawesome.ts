import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch, faCaretDown, faCaretUp,
  faTag
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faSearch, faCaretDown, faCaretUp,
  faTag
)

Vue.component('fontawesome', FontAwesomeIcon)

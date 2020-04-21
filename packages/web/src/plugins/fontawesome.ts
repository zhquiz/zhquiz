import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSearch, faCaretDown, faCaretUp
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faSearch, faCaretDown, faCaretUp
)

Vue.component('fontawesome', FontAwesomeIcon)

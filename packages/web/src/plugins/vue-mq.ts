import Vue from 'vue'
// @ts-ignore
import VueMq from 'vue-mq'

Vue.use(VueMq, {
  breakpoints: { // default breakpoints - customize this
    mobile: 600,
    tablet: 1024,
    desktop: Infinity
  }
})

import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {path: '/hanzi', component: () => import("./views/Hanzi.vue")},
    {path: '/vocab', component: () => import("./views/Vocab.vue")},
    {path: '/sentence', component: () => import("./views/Sentence.vue")}
  ]
})

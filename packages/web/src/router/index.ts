import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

Vue.use(VueRouter)

const routes: RouteConfig[] = [
  { path: '/', name: 'Home' },
  { path: '/hanzi', name: 'Hanzi' },
  { path: '/vocab', name: 'Vocab' },
  { path: '/quiz', name: 'Quiz' },
  { path: '/level', name: 'Level' },
  { path: '/extra', name: 'Extra' },
  { path: '/settings', name: 'Settings' }
]

const router = new VueRouter({
  mode: 'history',
  routes: routes.map(r => ({
    ...r,
    component: () => import(/* webpackChunkName: "[request]" */ `../views/${r.name}.vue`)
  }))
})

export default router

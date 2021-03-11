import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      redirect: '/random'
    },
    {
      path: '/extra',
      component: () =>
        import(/* webpackChunkName: "extra" */ '@/views/Extra.vue')
    },
    {
      path: '/hanzi',
      component: () =>
        import(/* webpackChunkName: "hanzi" */ '@/views/Hanzi.vue')
    },
    {
      path: '/level',
      component: () =>
        import(/* webpackChunkName: "level" */ '@/views/Level.vue')
    },
    {
      path: '/library',
      component: () =>
        import(/* webpackChunkName: "library" */ '@/views/Library.vue')
    },
    {
      path: '/quiz',
      component: () => import(/* webpackChunkName: "quiz" */ '@/views/Quiz.vue')
    },
    {
      path: '/random',
      component: () =>
        import(/* webpackChunkName: "random" */ '@/views/Random.vue')
    },
    {
      path: '/sentence',
      component: () =>
        import(/* webpackChunkName: "sentence" */ '@/views/Sentence.vue')
    },
    {
      path: '/settings',
      component: () =>
        import(/* webpackChunkName: "settings" */ '@/views/Settings.vue')
    },
    {
      path: '/vocab',
      component: () =>
        import(/* webpackChunkName: "vocab" */ '@/views/Vocab.vue')
    }
  ]
})

export default router

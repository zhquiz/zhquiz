import { NuxtConfig } from '@nuxt/types'

export default (): NuxtConfig => {
  const port = parseInt(process.env.PORT!) || 35594
  process.env.PORT = port.toString()

  return {
    // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
    ssr: true,

    // Target: https://go.nuxtjs.dev/config-target
    target: 'server',

    // Global page headers: https://go.nuxtjs.dev/config-head
    head: {
      title: 'ZhQuiz - Hanzi, Vocab and Sentences quizzing',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: '' },
      ],
      link: [
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.manifest' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
      script: [
        {
          async: true,
          defer: true,
          'data-domain': 'zhquiz.cc',
          src: 'https://plausible.io/js/plausible.js',
        },
      ],
    },

    // Global CSS: https://go.nuxtjs.dev/config-css
    css: ['~/styles/buefy.scss', '~/styles/app.scss'],

    // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
    plugins: [
      '~/plugins/api.ts',
      '~/plugins/filter.ts',
      '~/plugins/vue-context.client.js',
      '~/plugins/speak.client.ts',
    ],

    // Auto import components: https://go.nuxtjs.dev/config-components
    components: true,

    // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
    buildModules: [
      // https://go.nuxtjs.dev/typescript
      '@nuxt/typescript-build',
      'nuxt-typed-vuex',
    ],

    // Modules: https://go.nuxtjs.dev/config-modules
    modules: [
      // https://go.nuxtjs.dev/buefy
      [
        'nuxt-buefy',
        {
          defaultIconPack: 'fas',
          defaultIconComponent: 'fontawesome',
        },
      ],
      // https://go.nuxtjs.dev/pwa
      '@nuxtjs/pwa',
      [
        '@nuxtjs/fontawesome',
        {
          component: 'fontawesome',
          icons: {
            brands: ['faGithub'],
            solid: [
              'faAngleLeft',
              'faAngleRight',
              'faAngleUp',
              'faArrowUp',
              'faBookReader',
              'faCaretDown',
              'faCaretUp',
              'faChalkboardTeacher',
              'faCog',
              'faExclamationCircle',
              'faExclamationTriangle',
              'faEye',
              'faEyeSlash',
              'faInfoCircle',
              'faRandom',
              'faSearch',
              'faTag',
              'faListOl',
              'faBars',
              'faSave',
              'faTrash',
            ],
          },
        },
      ],
      '@nuxtjs/proxy',
    ],
    proxy: process.env.SERVER_PORT
      ? [`http://localhost:${process.env.SERVER_PORT}/api`]
      : [],

    // PWA module configuration: https://go.nuxtjs.dev/pwa
    pwa: {
      manifest: {
        lang: 'en',
      },
      icon: false,
    },

    // Build Configuration: https://go.nuxtjs.dev/config-build
    build: {
      extend(config) {
        config.node = config.node || {}
        config.node.fs = 'empty'
      },
    },
    server: {
      port,
    },
    env: {
      PORT: process.env.PORT,
    },
  }
}

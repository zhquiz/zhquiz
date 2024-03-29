import { NuxtConfig } from '@nuxt/types'

export default (): NuxtConfig => {
  process.env.SERVER_PORT = process.env.SERVER_PORT || '27082'

  return {
    // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
    ssr: false,

    // Target: https://go.nuxtjs.dev/config-target
    target: 'static',

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

    loading: {
      color: '#62C746',
      height: '5px',
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
    // components: true,

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
              'faListUl',
              'faListOl',
              'faBars',
              'faSave',
              'faTrash',
              'faTools',
              'faTh',
              'faRedoAlt',
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
        name: 'ZhQuiz',
        short_name: 'zhquiz',
        description:
          'ZhQuiz, a Chinese quizzing platform by levels and dictionary',
      },
    },

    // Build Configuration: https://go.nuxtjs.dev/config-build
    build: {
      extend(config) {
        config.node = config.node || {}
        config.node.fs = 'empty'
      },
    },
    generate: {
      dir: './public',
    },
    server: {
      port: process.env.PORT,
    },
  }
}

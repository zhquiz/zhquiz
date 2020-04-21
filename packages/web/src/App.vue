<template lang="pug">
main
  b-navbar.has-shadow.is-warning(style="margin-bottom: 1em;")
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        strong Zh
        span View
    template(slot="start")
      b-navbar-item(tag="router-link" to="/hanzi" :active="$route.path === '/hanzi'") Hanzi
      b-navbar-item(tag="router-link" to="/vocab" :active="$route.path === '/vocab'") Vocab
      b-navbar-item(tag="router-link" to="/sentence" :active="$route.path === '/sentence'") Sentence
      b-navbar-item(href="https://github.com/patarapolw/zhview" target="_blank" rel="noopener") About
  router-view
</template>

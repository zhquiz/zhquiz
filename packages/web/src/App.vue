<template lang="pug">
main
  el-menu(mode="horizontal")
    el-menu-item(index="1")
      router-link(to="/")
        strong Zh
        span view
    el-menu-item(index="2")
      router-link(to="/hanzi") Hanzi
    el-menu-item(index="3")
      router-link(to="/vocab") Vocab
    el-menu-item(index="4")
      router-link(to="/sentence") Sentence
    el-menu-item(index="5")
      a(href="https://github.com/patarapolw/zhview" target="_blank" rel="noopener") About
  router-view
</template>

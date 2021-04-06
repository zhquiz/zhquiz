<template>
  <div class="DefaultLayout">
    <nuxt />
  </div>
</template>

<script>
window.onbeforeunload = function (e) {
  e.preventDefault()
  e.returnValue = 'not returned'
}
</script>

<style lang="scss">
html,
body,
#__nuxt,
#__layout,
.DefaultLayout {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior-y: none;
}
</style>

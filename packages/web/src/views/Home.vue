<template lang="pug">
.columns#Home
  .column.is-6-desktop(style="margin-top: 1em;")
    .content
      h1 ZhQuiz - A Chinese quizzing app

      b-button.is-info(style="width: 100%; margin-bottom: 1em;" @click="doLogin()")
        fontawesome(:icon="['fab', 'google']" style="margin-right: 1em;")
        span Login with Google

      h4 So, you want to learn Chinese. Let's see. How much you can read?
      figure.image.is-16by9
        iframe.has-ratio(src='https://www.youtube.com/embed/iomE0xiYoqY' frameborder='0'
          allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture', allowfullscreen='')
      h2 Features
      ul
        li HSK vocabularies made into 60 levels
        li Flashcards showing statuses of success
        li Custom vocabularies input by users
        li Speech-enabled
      h4 Login to try now.
  .background
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import firebase from 'firebase/app'

import 'firebase/auth'

@Component
export default class Home extends Vue {
  doLogin () {
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase.auth().signInWithPopup(provider)
  }
}
</script>

<style lang="scss" scoped>
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -100;
  background-image: radial-gradient(circle at 28% 51%, rgba(206, 206, 206,0.03) 0%, rgba(206, 206, 206,0.03) 17%,transparent 17%, transparent 100%),radial-gradient(circle at 45% 10%, rgba(10, 10, 10,0.03) 0%, rgba(10, 10, 10,0.03) 45%,transparent 45%, transparent 100%),radial-gradient(circle at 48% 44%, rgba(74, 74, 74,0.03) 0%, rgba(74, 74, 74,0.03) 84%,transparent 84%, transparent 100%),radial-gradient(circle at 47% 50%, rgba(186, 186, 186,0.03) 0%, rgba(186, 186, 186,0.03) 23%,transparent 23%, transparent 100%),radial-gradient(circle at 29% 70%, rgba(9, 9, 9,0.03) 0%, rgba(9, 9, 9,0.03) 32%,transparent 32%, transparent 100%),radial-gradient(circle at 2% 75%, rgba(179, 179, 179,0.03) 0%, rgba(179, 179, 179,0.03) 19%,transparent 19%, transparent 100%),radial-gradient(circle at 2% 36%, rgba(26, 26, 26,0.03) 0%, rgba(26, 26, 26,0.03) 1%,transparent 1%, transparent 100%),radial-gradient(circle at 53% 70%, rgba(90, 90, 90,0.03) 0%, rgba(90, 90, 90,0.03) 55%,transparent 55%, transparent 100%),radial-gradient(circle at 28% 92%, rgba(31, 31, 31,0.03) 0%, rgba(31, 31, 31,0.03) 35%,transparent 35%, transparent 100%),linear-gradient(90deg, rgb(255,255,255),rgb(255,255,255));
}
</style>

<template>
  <b-loading active />
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component<IndexPage>({
  watch: {
    '$store.state.isAuthReady'() {
      this.navigate()
    },
  },
})
export default class IndexPage extends Vue {
  mounted() {
    this.navigate()
  }

  navigate() {
    if (this.$accessor.isAuthReady) {
      if (this.$fireAuth.currentUser) {
        this.$router.push('/random')
      } else {
        this.$router.push('/login')
      }
    }
  }
}
</script>

<style scoped>
.IndexPage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.IndexPage article {
  margin-top: 1rem;
  width: calc(100vw - 1rem);
}

@media (min-width: 769px) {
  .IndexPage article {
    max-width: 60vw;
  }
}

.content button {
  width: 100%;
  margin-bottom: 1rem;
}

button > span + span {
  margin-left: 1rem;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -100;
  background-image: radial-gradient(
      circle at 28% 51%,
      rgba(206, 206, 206, 0.03) 0%,
      rgba(206, 206, 206, 0.03) 17%,
      transparent 17%,
      transparent 100%
    ),
    radial-gradient(
      circle at 45% 10%,
      rgba(10, 10, 10, 0.03) 0%,
      rgba(10, 10, 10, 0.03) 45%,
      transparent 45%,
      transparent 100%
    ),
    radial-gradient(
      circle at 48% 44%,
      rgba(74, 74, 74, 0.03) 0%,
      rgba(74, 74, 74, 0.03) 84%,
      transparent 84%,
      transparent 100%
    ),
    radial-gradient(
      circle at 47% 50%,
      rgba(186, 186, 186, 0.03) 0%,
      rgba(186, 186, 186, 0.03) 23%,
      transparent 23%,
      transparent 100%
    ),
    radial-gradient(
      circle at 29% 70%,
      rgba(9, 9, 9, 0.03) 0%,
      rgba(9, 9, 9, 0.03) 32%,
      transparent 32%,
      transparent 100%
    ),
    radial-gradient(
      circle at 2% 75%,
      rgba(179, 179, 179, 0.03) 0%,
      rgba(179, 179, 179, 0.03) 19%,
      transparent 19%,
      transparent 100%
    ),
    radial-gradient(
      circle at 2% 36%,
      rgba(26, 26, 26, 0.03) 0%,
      rgba(26, 26, 26, 0.03) 1%,
      transparent 1%,
      transparent 100%
    ),
    radial-gradient(
      circle at 53% 70%,
      rgba(90, 90, 90, 0.03) 0%,
      rgba(90, 90, 90, 0.03) 55%,
      transparent 55%,
      transparent 100%
    ),
    radial-gradient(
      circle at 28% 92%,
      rgba(31, 31, 31, 0.03) 0%,
      rgba(31, 31, 31, 0.03) 35%,
      transparent 35%,
      transparent 100%
    ),
    linear-gradient(90deg, rgb(255, 255, 255), rgb(255, 255, 255));
}
</style>

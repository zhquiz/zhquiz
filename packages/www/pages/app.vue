<template>
  <section>
    <nav class="tabs is-boxed">
      <ul></ul>
    </nav>

    <main></main>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class AppPage extends Vue {}
</script>

<style lang="scss" scoped>
nav.tabs {
  padding-top: 0.5em;
  padding-left: 0.5em;
  margin-bottom: 0 !important;
  background-color: rgba(211, 211, 211, 0.3);

  li:not(.is-active) a {
    background-color: lightgray;
  }

  li + li {
    margin-left: 0.5em !important;
  }

  li a {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
}

main ::v-deep() iframe {
  border: 0;
  width: 100%;
  height: 100%;
}

.delete {
  border: none !important;
  transform: translateX(50%);
  background-color: rgba(143, 183, 221, 0.61) !important;

  &:hover {
    background-color: lightgray !important;
  }
}

.loading {
  color: lightgray;

  > span {
    $n: 3;
    $speed: 0.1s;

    position: relative;
    animation: loading (($n + 1) * $speed) infinite;

    @for $i from 1 through $n {
      &:nth-child(#{$i}) {
        animation-delay: $i * $speed;
      }
    }
  }

  @keyframes loading {
    0% {
      color: inherit;
    }

    40% {
      color: gray;
    }

    100% {
      color: inherit;
    }
  }
}
</style>

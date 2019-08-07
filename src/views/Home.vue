<template lang="pug">
  v-container
    v-layout(column="")
      v-flex.mt-3(xs12)
        i Right click for more options and to speak.
      v-flex.mt-3(xs12)
        v-layout(row="")
          v-flex(md5 xs12 pa-3)
            v-textarea.clipboard-textarea(outlined v-model="taValue")
          v-flex(md7 xs12 pa-3)
            div(v-if="parsedSegments.length === 0")
              i The result of the parsing of the text will be shown here.
            div(v-else="")
              span(v-for="seg in parsedSegments")
                span(v-if="typeof seg === 'string'") {{seg}}
                span(v-else="")
                  ruby
                    rt {{seg.pinyin}}
                    span.zh-contextmenu.vocab {{seg.word}}
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class Home extends Vue {
  private taValue: string = "";
  private parsedSegments: any[] = [];
}
</script>

<style lang="scss">
.clipboard-textarea {
  background-color: white;
}
</style>

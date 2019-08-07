<template lang="pug">
  v-container
    v-layout(row)
      v-flex(xs12)
        v-text-field(prepend-icon="mdi-magnify" placeholder="Type Hanzi, Pinyin or English to search." single-line)
      v-flex.mt-3(md6 xs12)
        v-layout(align-center justify-start column)
          v-flex(xs12)
            v-text-field.hanzi-textfield(height="200")
          v-flex(xs12)
            v-btn-toggle.prev-next(rounded :value="-1")
              v-btn(width="120")
                span Previous
              v-btn(width="100")
                span Next
              v-menu(v-model="isMenuOpen" offset-y left)
                template(v-slot:activator="{on}")
                  v-btn(v-on="on")
                    v-icon mdi-menu-down
                v-list
                  v-list-item(v-for="(item, i) in menuItems" :key="i")
                    v-list-item-title {{item.title}}
      v-flex.mt-3(md6 xs12)
        div Hello
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";

@Component
export default class Vocab extends Vue {
  private isMenuOpen = false;
  private menuItems = [
    { title: "Open in MDBG" },
    { title: "Speak" },
    { title: "Randomize" }
  ];
}
</script>


<style lang="scss">
.vocab-textfield {
  width: 1em;
  font-size: 200px;

  input {
    max-height: 200px;
  }
}
</style>

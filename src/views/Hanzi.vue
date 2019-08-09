<template lang="pug">
  v-container
    v-layout(row)
      v-flex(xs12)
        v-text-field(prepend-icon="mdi-magnify" placeholder="Type Hanzi, Pinyin or English to search." single-line v-model="q")
      v-flex.mt-3(md5 xs12)
        v-layout(align-center justify-start column)
          v-flex(xs12)
            v-text-field.hanzi-textfield(height="200" v-model="h")
          v-flex(xs12)
            v-btn-toggle.prev-next(rounded :value="-1")
              v-btn(width="120" @click="eIndex--" :disabled="eIndex <= 0")
                span Previous
              v-btn(width="100" @click="eIndex++" :disabled="eIndex >= eList.length - 1")
                span Next
              v-menu(v-model="isMenuOpen" offset-y left)
                template(v-slot:activator="{on}")
                  v-btn(v-on="on")
                    v-icon mdi-menu-down
                v-list
                  v-list-item(v-if="h" @click="openInMdbg(h)")
                    v-list-item-title Open in MDBG
                  v-list-item(v-if="h" @click="speak(h)")
                    v-list-item-title Speak
                  v-list-item(@click="loadH()")
                    v-list-item-title Randomize
      v-flex.mt-3(md7 xs12)
        v-layout.pa-3(column)
          v-flex(v-if="e.sub")
            h2 Subcompositions
          v-flex
            .d-inline-block.mr-3(v-for="c in (e.sub || '')" :key="c")
              .large(@click="loadH(c)") {{c}}
          v-flex(v-if="e.sup")
            h2 Supercompositions
          v-flex
            .d-inline-block.mr-3(v-for="c in (e.sup || '')" :key="c")
              .large(@click="loadH(c)") {{c}}
          v-flex(v-if="e.var")
            h2 Variants
          v-flex
            .d-inline-block.mr-3(v-for="c in (e.var || '')" :key="c")
              .large(@click="loadH(c)") {{c}}
          v-flex(v-if="vList.length > 0")
            h2 Vocabularies
          v-flex(v-for="v in vList", :key="`${v.simplified}/${v.traditional}/${v.pinyin}`")
            span {{`${v.simplified} ${v.traditional ? ` ${v.traditional} `: ""}[${v.pinyin}] ${v.english}`}}
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { fetchJSON, openInMdbg, speak } from '../util';
import { IVocabEntry } from './Vocab.vue';

interface IHanziEntry {
  entry: string;
  sub?: string;
  sup?: string;
  var?: string;
}

@Component
export default class Hanzi extends Vue {
  private isMenuOpen = false;
  private q = "";
  private eList: IHanziEntry[] = [];
  private eIndex: number = 0;
  private vList: IVocabEntry[] = [];

  private openInMdbg = openInMdbg;
  private speak = speak;

  get h() {
    return this.e.entry;
  }

  set h(h0: string) {
    this.e = {entry: h0};
  }

  get e() {
    return this.eList[this.eIndex] || {};
  }

  set e(e0: IHanziEntry) {
    this.eList = [e0];
    this.eIndex = 0;
  }

  public mounted() {
    this.loadH();
  }

  private async loadH(h?: string) {
    let r: any;
    if (h) {
      r = (await fetchJSON("/api/hanzi/", {q: h, limit: 1})).data[0];
    } else {
      r = await fetchJSON("/api/hanzi/random", {q: this.q});
    }
    const v = await fetchJSON("/api/vocab/", {q: r.entry});

    this.e = r;
    this.vList = v.data;
  }
}
</script>


<style lang="scss">
.hanzi-textfield {
  width: 1em;
  font-size: 200px;

  input {
    max-height: 200px;
  }
}
</style>

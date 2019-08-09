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
                  v-list-item(@click="randomize()")
                    v-list-item-title Randomize
      v-flex.mt-3(md7 xs12)
        v-layout.pa-3(column)
          v-flex(v-if="e.sub")
            h2 Subcompositions
          v-flex.radical-list
            .d-inline-block.mr-3(v-for="c in (e.sub || '')" :key="c")
              .large(@click="q = c") {{c}}
          v-flex(v-if="e.sup")
            h2 Supercompositions
          v-flex.radical-list
            .d-inline-block.mr-3(v-for="c in (e.sup || '')" :key="c")
              .large(@click="q = c") {{c}}
          v-flex(v-if="e.var")
            h2 Variants
          v-flex.radical-list
            .d-inline-block.mr-3(v-for="c in (e.var || '')" :key="c")
              .large(@click="q = c") {{c}}
          v-flex(v-if="vList.length > 0")
            h2 Vocabularies
          v-flex(v-for="v in vList", :key="`${v.simplified}/${v.traditional}/${v.pinyin}`")
            span {{`${v.simplified} ${v.traditional ? ` ${v.traditional} `: ""}[${v.pinyin}] ${v.english}`}}
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { fetchJSON, openInMdbg, speak, normalizeArray } from '../util';
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
  private isLoading = false;

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

    if (e0) {
      this.onHChanged();
    }
  }

  public mounted() {
    this.randomize();
    window.addEventListener("keydown", this.hotkeysHandler);
  }

  public beforeDestroy() {
    window.removeEventListener("keydown", this.hotkeysHandler);
  }

  private hotkeysHandler(evt: KeyboardEvent) {
    const {target, code} = evt;

    if (target && (target as any).tagName.toLocaleUpperCase() === "INPUT") {
      return;
    }

    switch(code) {
      case "KeyR": this.randomize(); break;
      case "KeyS": speak(this.h); break;
      case "KeyX": openInMdbg(this.h); break;
      case "ArrowLeft": this.click("prev"); break;
      case "ArrowRight": this.click("next"); break;
      case "Backquote": this.speakN(0); break;
      default:
        const m = /Digit(\d)/.exec(code);
        if (m) {
          this.speakN(parseInt(m[1]));
        }
    }
  }

  private click(name: string) {
    const el = normalizeArray<any>(this.$refs[name]);
    if (el && !el.disabled && el.click) {
      el.click();
    }
  }

  private speakN(n: number) {
    const v = this.vList[n];
    if (v) {
      speak(v.simplified);
    }
  }

  private async randomize() {
    this.eList = (await fetchJSON("/api/hanzi/", {q: this.q, limit: 1})).data;
  }

  @Watch("q")
  private async onQChanged() {
    if (!this.isLoading) {
      this.isLoading = true;
      this.eList = (await fetchJSON("/api/hanzi/", {q: this.q, limit: -1})).data;
      this.eIndex = 0;
      this.isLoading = false;
    } else {
      const q = this.q;
      setTimeout(() => {
        this.q = q;
      }, 1000);
    }
  }

  @Watch("h")
  private async onHChanged() {
    if (this.h) {
      const v = await fetchJSON("/api/vocab/", {q: this.h});
      this.vList = v.data;
    } else {
      this.vList = [];
    }
  }
}
</script>


<style lang="scss">
.hanzi-textfield {
  width: 1em;
  font-size: 200px;

  input {
    max-height: 200px;
    font-family: HanaMin;
  }
}

.radical-list {
  max-height: 200px;
  overflow-y: scroll;
}

.large {
  font-size: 50px;
  font-family: HanaMin;

  &:hover {
    color: blue;
  }
}
</style>

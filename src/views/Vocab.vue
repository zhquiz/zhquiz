<template lang="pug">
  v-container
    v-layout(row)
      v-flex(xs12)
        v-text-field(prepend-icon="mdi-magnify" placeholder="Type Hanzi, Pinyin or English to search." single-line v-model="q" )
      v-flex.mt-3(md5 xs12)
        v-layout(align-center justify-start column)
          v-flex(xs12)
            v-text-field.vocab-textfield(height="100" v-model="v")
          v-flex(xs12)
            v-btn-toggle.prev-next(rounded :value="-1")
              v-btn(width="120" @click="eIndex--" :disabled="eIndex <= 0" ref="prev")
                span Previous
              v-btn(width="100" @click="eIndex++" :disabled="eIndex >= eList.length - 1" ref="next")
                span Next
              v-menu(v-model="isMenuOpen" offset-y left)
                template(v-slot:activator="{on}")
                  v-btn(v-on="on")
                    v-icon mdi-menu-down
                v-list
                  v-list-item(v-if="v" @click="openInMdbg(v)")
                    v-list-item-title Open in MDBG
                  v-list-item(v-if="v" @click="speak(v)")
                    v-list-item-title Speak
                  v-list-item(@click="randomize")
                    v-list-item-title Randomize
      v-flex.mt-3(md7 xs12)
        v-layout.pa-3(column)
          v-flex(v-if="e.traditional")
            .large {{e.traditional}}
          v-flex(v-if="e.pinyin")
            h2 Pinyin
          v-flex
            span {{e.pinyin}}
          v-flex(v-if="e.english")
            h2 English
          v-flex
            span {{e.english}}
          v-flex(v-if="sList.length > 0")
            h2 Sentences
          v-flex(v-for="s in sList", :key="s.chinese")
            span {{`${s.chinese} ${s.english}`}}
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { fetchJSON, openInMdbg, speak, normalizeArray } from '../util';
import { ISentenceEntry } from './Sentence.vue';

export interface IVocabEntry {
  simplified: string;
  traditional?: string;
  pinyin?: string;
  english?: string;
}

@Component
export default class Vocab extends Vue {
  private isMenuOpen = false;
  private q = "";
  private eList: IVocabEntry[] = [];
  private eIndex: number = 0;
  private sList: ISentenceEntry[] = [];
  private isLoading = false;

  private openInMdbg = openInMdbg;
  private speak = speak;

  get v() {
    return this.e.simplified;
  }

  set v(v0: string) {
    this.e = {simplified: v0};
  }

  get e() {
    return this.eList[this.eIndex] || {};
  }

  set e(e0: IVocabEntry) {
    this.eList = [e0];
    this.eIndex = 0;

    if (e0) {
      this.onVChanged();
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
      case "KeyS": speak(this.v); break;
      case "KeyX": openInMdbg(this.v); break;
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
    const v = this.sList[n];
    if (v) {
      speak(v.chinese);
    }
  }

  private async randomize() {
    this.eList = (await fetchJSON("/api/vocab/", {q: this.q, limit: 1})).data;
  }

  @Watch("q")
  private async onQChanged() {
    if (!this.isLoading) {
      this.isLoading = true;
      this.eList = (await fetchJSON("/api/vocab/", {q: this.q, limit: -1})).data;
      this.isLoading = false;
    } else {
      const q = this.q;
      setTimeout(() => {
        this.q = q;
      }, 1000);
    }
  }

  @Watch("v")
  private async onVChanged() {
    if (this.v) {
      const s = await fetchJSON("/api/sentence/", {q: this.v});
      this.sList = s.data;
    } else {
      this.sList = [];
    }
  }
}
</script>


<style lang="scss">
.vocab-textfield {
  width: 3em;
  font-size: 100px;

  input {
    max-height: 100px;
    text-align: center;
  }
}

.large {
  font-size: 50px;
}
</style>

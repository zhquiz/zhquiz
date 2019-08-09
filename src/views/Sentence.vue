<template lang="pug">
  v-card(elevation="0")
    v-card-title
      | Sentences
      v-spacer
      v-text-field(v-model="q" prepend-icon="mdi-magnify" single-line append-icon="mdi-shuffle-variant" @click:append="shuffle")
    v-data-table(:headers="headers" :items="items" :options.sync="options" :server-items-length="count"
    :loading="loading" :page.sync="page")
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { shuffle, fetchJSON, speak } from "@/util";

export interface ISentenceEntry {
  chinese: string;
  pinyin: string;
  english: string;
  percentile?: number;
  level?: number;
}

@Component
export default class Sentence extends Vue {
  private q: string = "";
  private headers = [
    { text: "Chinese", value: "chinese" },
    { text: "Pinyin", value: "pinyin" },
    { text: "English", value: "english" },
    { text: "Percentile", value: "percentile" },
    { text: "Level", value: "level" }
  ];
  private count = 0;
  private loading = true;
  private options: any = {};
  private page = 1;
  private items: ISentenceEntry[] = [];

  public mounted() {
    window.addEventListener("keydown", this.hotkeysHandler);
  }

  public beforeDestroy() {
    window.removeEventListener("keydown", this.hotkeysHandler);
  }

  private hotkeysHandler(evt: any) {
    const {target, code} = evt;

    if (target && (target as any).tagName.toLocaleUpperCase() === "INPUT") {
      return;
    }

    switch(code) {
      case "KeyR": this.shuffle(); break;
      case "ArrowLeft": this.page--; break;
      case "ArrowRight": this.page++; break;
      case "Backquote": this.speakN(0); break;
      default:
        const m = /Digit(\d)/.exec(code);
        if (m) {
          this.speakN(parseInt(m[1]));
        }
    }
  }

  private speakN(n: number) {
    const s = this.items[n];
    if (s) {
      speak(s.chinese);
    }
  }

  @Watch("q")
  @Watch("page")
  @Watch("options", { deep: true })
  private async getDataFromApi() {
    this.loading = true;
    const { sortBy, sortDesc, page, itemsPerPage } = this.options;
    // console.log(this.options);

    const r = await fetchJSON("/api/sentence/", {
      q: this.q,
      offset: (page - 1) * itemsPerPage,
      limit: itemsPerPage,
      sortBy: sortBy[0] || "random",
      desc: sortDesc[0]
    });

    this.loading = false;
    this.items = r.data;
    this.count = r.count;
  }

  private shuffle() {
    this.options.offset = 0;
    this.options.sortBy = [];
    this.options.sortDesc = [];
  }
}
</script>


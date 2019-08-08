<template lang="pug">
  v-card(elevation="0")
    v-card-title
      | Sentences
      v-spacer
      v-text-field(v-model="q" prepend-icon="mdi-magnify" single-line append-icon="mdi-shuffle-variant" @click:append="shuffle")
    v-data-table(:headers="headers" :items="items" :options.sync="options" :server-items-length="count"
    :loading="loading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { shuffle, fetchJSON } from "@/util";

export interface ISentenceEntry {
  chinese: string;
  pinyin: string;
  english: string;
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
  private items: any[] = [];

  @Watch("q")
  @Watch("options", { deep: true })
  private getDataFromApi() {
    this.loading = true;
    return new Promise((resolve, reject) => {
      const { sortBy, sortDesc, page, itemsPerPage } = this.options;
      console.log(this.options);

      fetchJSON("/api/sentence/", {
        q: this.q,
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        sortBy: sortBy[0],
        desc: sortDesc[0]
      }).then((r) => {
        console.log(r);

        this.loading = false;
        this.items = r.data;
        this.count = r.count;
      });
    });
  }

  private shuffle() {
    const entities = this.q.split(" ").filter((x) => x);
    const kw = "sortBy:random";

    if (!entities.includes(kw)) {
      entities.push(kw);
      this.q = entities.join(" ");
    }
  }
}
</script>


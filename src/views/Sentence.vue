<template lang="pug">
  v-card(elevation="0")
    v-card-title
      | Sentences
      v-spacer
      v-text-field(v-model="q" prepend-icon="mdi-magnify" single-line)
    v-data-table(:headers="headers" :items="items" :options.sync="options" :server-items-length="count"
    :loading="loading")
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";

@Component
export default class App extends Vue {
  private q: string = "";
  private headers = [
    {
      text: "Dessert (100g serving)",
      align: "left",
      sortable: false,
      value: "name"
    },
    { text: "Calories", value: "calories" },
    { text: "Fat (g)", value: "fat" },
    { text: "Carbs (g)", value: "carbs" },
    { text: "Protein (g)", value: "protein" },
    { text: "Iron (%)", value: "iron" }
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
      console.log(this.options);
      const { sortBy, descending, page, itemsPerPage } = this.options;

      let items = [
        {
          name: "Frozen Yogurt",
          calories: 159,
          fat: 6.0,
          carbs: 24,
          protein: 4.0,
          iron: "1%"
        },
        {
          name: "Ice cream sandwich",
          calories: 237,
          fat: 9.0,
          carbs: 37,
          protein: 4.3,
          iron: "1%"
        },
        {
          name: "Eclair",
          calories: 262,
          fat: 16.0,
          carbs: 23,
          protein: 6.0,
          iron: "7%"
        },
        {
          name: "Cupcake",
          calories: 305,
          fat: 3.7,
          carbs: 67,
          protein: 4.3,
          iron: "8%"
        },
        {
          name: "Gingerbread",
          calories: 356,
          fat: 16.0,
          carbs: 49,
          protein: 3.9,
          iron: "16%"
        },
        {
          name: "Jelly bean",
          calories: 375,
          fat: 0.0,
          carbs: 94,
          protein: 0.0,
          iron: "0%"
        },
        {
          name: "Lollipop",
          calories: 392,
          fat: 0.2,
          carbs: 98,
          protein: 0,
          iron: "2%"
        },
        {
          name: "Honeycomb",
          calories: 408,
          fat: 3.2,
          carbs: 87,
          protein: 6.5,
          iron: "45%"
        },
        {
          name: "Donut",
          calories: 452,
          fat: 25.0,
          carbs: 51,
          protein: 4.9,
          iron: "22%"
        },
        {
          name: "KitKat",
          calories: 518,
          fat: 26.0,
          carbs: 65,
          protein: 7,
          iron: "6%"
        }
      ];
      const total = items.length;

      if (this.options.sortBy) {
        items = items.sort((a, b) => {
          const sortA = (a as any)[sortBy];
          const sortB = (b as any)[sortBy];

          if (descending) {
            if (sortA < sortB) return 1;
            if (sortA > sortB) return -1;
            return 0;
          } else {
            if (sortA < sortB) return -1;
            if (sortA > sortB) return 1;
            return 0;
          }
        });
      }

      if (itemsPerPage > 0) {
        items = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
      }

      setTimeout(() => {
        this.loading = false;
        this.items = items;
        this.count = total;
        resolve();
      }, 1000);
    });
  }
}
</script>


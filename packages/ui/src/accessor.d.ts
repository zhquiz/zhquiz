import Vue from 'vue'
import { accessor } from './src/store'

declare module 'vue/types/vue' {
  interface Vue {
    $accessor: typeof accessor;
  }
}

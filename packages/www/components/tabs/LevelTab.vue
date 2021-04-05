<template>
  <b-tabs :value="1">
    <b-tab-item label="Character">
      <level-card type="character" />
    </b-tab-item>
    <b-tab-item label="Vocabulary">
      <level-card type="vocabulary" />
    </b-tab-item>
  </b-tabs>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import LevelCard from '../cards/LevelCard.vue'

@Component<LevelTab>({
  components: {
    LevelCard,
  },
  created() {
    this.$emit('title', 'Level')
  },
})
export default class LevelTab extends Vue {}
</script>

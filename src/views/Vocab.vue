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
              v-btn(width="150")
                span Previous
              v-btn(width="150")
                span Next
      v-flex.mt-3(md6 xs12)
        div Hello
</template>

<style lang="scss">
.vocab-textfield {
  width: 1em;
  font-size: 200px;

  input {
    max-height: 200px;
  }
}
</style>

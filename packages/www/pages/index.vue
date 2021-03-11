<template>
  <section class="section">Pending...</section>
</template>

<script>
export default {
  name: 'HomePage',
  middleware: ({ redirect }) => {
    redirect('/app')
  },
}
</script>

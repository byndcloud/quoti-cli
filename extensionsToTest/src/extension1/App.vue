<template lang="pug">
    v-col
      p Extensão 1(com build)
      MyComponent
</template>

<script>
import MyComponent from './views/MyComponent'
export default {
  name: 'extension 1',
  components: {
    MyComponent
  },
}
</script>

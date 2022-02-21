<template lang="pug">
    v-col
      p Extensão 1(com build)
      MyComponent
</template>

<script>
import MyComponent from './MyComponent'
export default {
  name: 'extension 2',
  components: {
    MyComponent
  },
}
</script>

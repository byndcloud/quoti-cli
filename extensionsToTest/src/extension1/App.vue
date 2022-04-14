<template lang="pug">
    div
      MyComponent
      p {{value}}
      p atividade desenvolvida Date.now 1647461617555
</template>

<script>
// import MyComponent from "./MyComponent";
import MyComponent from "@/extension1/views/MyComponent";
import { getMessage } from "./utils/index"
export default {
  name: "productsMarketplaceOverview",
  components: {
    MyComponent,
  },
  data: function() {
    return { 
      value: 'Dado nao lido de um arquivo js aaa'
    };
  },
  created(){
    this.value = getMessage('Dado lido de um arquivo js')
  }
};
</script>

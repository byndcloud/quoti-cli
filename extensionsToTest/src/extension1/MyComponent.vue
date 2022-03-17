<template lang="pug">
h1 Uma extensão já criada. Luiz A s s PSasdsad dsa{{value}}
</template>

<script>
import { getPiNumber } from "./utils/index2"
export default {
  name: "productsMarketplaceOverview",
  data: function() {
    return { 
      value: 'Dado nao lido de um arquivo js'
    };
  },
  created(){
    this.value = getPiNumber('Dado lido de um arquivo js')
  }
};
</script>

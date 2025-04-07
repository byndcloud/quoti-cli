<template lang="pug">
div 
  h1 Uma extensão já criada.{{value}} 
  h1 Uma extensão feita pela org Marketplace1. Date.now() : 1647450202148
</template>

<script>
import { getPiNumber } from "../utils/index2"
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

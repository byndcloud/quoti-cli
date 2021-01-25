<template>
  <v-tabs
    v-model="tab"
    align-with-title
  >
    <v-tabs-slider color="black"></v-tabs-slider>
    <v-tab :key="'1'">
      <span> Usando API Quoti  </span>
    </v-tab>
    <v-tab :key="'2'">
      <span> Usando Firebase Quoti </span>
    </v-tab>
    <v-tabs-items v-model="tab">
      <v-tab-item :key="'1'">
        <v-dialog
          v-model="dialog"
          width="500"
        >
          <v-card>
            <v-card-title class="headline">
              Adicione uma anotação para o usuário
            </v-card-title>
            <v-card-text>Essa anotação será salva no Firebase</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-text-field
                v-model="anotacao"
                label="Anotação"
                outlined
              ></v-text-field>
              <v-spacer></v-spacer>
              <v-btn
                text
                @click="salvandoAnotacoes()"
              >
                Salvar Anotação
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headers"
              :items="usersComputed"
              class="elevation-1"
            >
              <template v-slot:item.anotacoes="{ item }">
                <v-btn :loading="false"  @click="openDialog(item)" icon>
                  Add anotação
                </v-btn>

              </template>
            </v-data-table>
          </v-col>
          <v-col cols="12">
            <v-alert
              color="black"
              type="warning"
            >Esse é um template exemplo de como podemos consultar
             dados de todos os usuários cadastrados na Organização usando a API Quoti. Consulte o código para saber mais.</v-alert>
          </v-col>

        </v-row>
      </v-tab-item>
      <v-tab-item :key="'2'">
        <v-row v-if="itemFirebaseComputed.length > 0">
          <v-col cols="12">
            <v-data-table
              :headers="headersFirebase"
              :items="itemFirebaseComputed"
              class="elevation-1"
            >
              <template v-slot:item.delete="{ item }">
                <v-btn :loading="isDeleting[item.id]"  @click="apagarItem(item)" icon>
                  Apagar
                </v-btn>

              </template>
            </v-data-table>
          </v-col>
          <v-col cols="12">
            <v-alert
              color="black"
              type="warning"
            >Esse é um template exemplo de como podemos consultar e deletar
              dados do Firebase Quoti. Experimente usar a tela anterior para adicionar ou editar anotações.</v-alert>
            
          </v-col>
        </v-row>
        <v-row v-else>
          <v-alert
            class="mt-10"
            color="black"
            type="warning"
          > Ainda não possui nenhuma anotacão salva. Experimente usar a tela anterior para cadastrar novas anotações</v-alert>
        </v-row>
      </v-tab-item>
    </v-tabs-items>
  </v-tabs>
</template>
<script>

const Quoti = {
  axios: config.axios,
  moment: moment,
  firestoreData: Firestore.collection(`/dynamicComponents/${id}/data/`).doc('collections'),
  organizationApi: Organization,
  userApi: User, 
  presenceApi: Presence,
  gradesApi: Grades,
  catracaApi: Catraca,
  postApi: Post,
  notificationsApi: Notifications
}
// tudo que estiver dentro da tag script e fora de e xport  default{} será desconsiderado
let variavelDesconsiderada = 'Sou uma variável declarada fora de e xport default e portanto não tenho utilidade'
// Objeto Quoti para o desenvolvedor acessar as ferramentas do Quoti
export default {
  
  data () {
    return {
      tab: null,
      dialog: false,
      anotacao:'',
      headers: [
        { text: 'Usuário', align: 'start', value: 'name' },
        { text: 'CPF', value: 'cpf' },
        { text: 'Type', value: 'type' },
        { text: 'Anotações',align: 'center',value: 'anotacoes'},
      ],
      headersFirebase: [
        { text: 'Usuário', align: 'start', value: 'name' },
        { text: 'Anotações',align: 'center',value: 'anotacoes'},
        { text: 'Excluir',align: 'right',value: 'delete'},
      ],
      users: '',
      itemFirebase: [],
      isDeleting: {}
    }
  },
  computed: {
    usersComputed: function () {
      return this?.users ? this.users : []
    },
    itemFirebaseComputed: function () {
      return this.itemFirebase
    } 
  },
  methods: {
    openDialog(item){
      this.anotacao = ''
      this.userSelected = item
      this.dialog = true
    },
    async salvandoAnotacoes(){
      const id = this.userSelected.id
      const name = this.userSelected.name
      Quoti.firestoreData.collection("Anotacoes").doc(`${id}`).set({
        anotacoes: this.anotacao,
      }).then( (docRef) => {
        this.dialog = false
        let itemUpdated = this.itemFirebase.find(element => element.id == id);
        if(itemUpdated) itemUpdated.anotacoes = this.anotacao
        else this.itemFirebase.push({name: name, anotacoes: this.anotacao, id: id})
      })
    },
    async apagarItem(item){
      console.log(item)
      this.$set(this.isDeleting, item.id, true)
      await Quoti.firestoreData.collection("Anotacoes").doc(`${item.id}`).delete()
      const index = this.itemFirebase.findIndex(element => {
        return element.id == item.id
      });
      if (index > -1) {
        this.itemFirebase.splice(index, 1);
      }
      this.$set(this.isDeleting, item.id, false)
    }
  },
  async created() {
    //usando API Quoti
    const result = await Quoti.userApi.list({
      types: undefined
    })
    this.users = result
    //usando o Firebase Quoti
    const resultFirebase = await Quoti.firestoreData.collection("Anotacoes").get()
    this.itemFirebase = resultFirebase.docs.map(doc =>{
      let name = this.users.find(element => element.id == doc.id).name;
      return {name: name, anotacoes: doc.data().anotacoes, id: doc.id}
    })
  }
}
</script>



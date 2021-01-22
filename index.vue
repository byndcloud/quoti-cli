<template>
  <v-tabs
    v-model="tab"
    align-with-title
  >
    <v-tabs-slider color="blue"></v-tabs-slider>
    <v-tab :key="'1'">
      <span> Usando API Quoti7 </span>
    </v-tab>
    <v-tab :key="'2'">
      <span> Usando o Firebase </span>
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
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item.anotacoes="{ item }">
                <v-btn :loading="false"  @click="openDialog(item)" icon>
                  <!-- <v-icon mdi-file-download-outline></v-icon> -->
                  Add anotação
                </v-btn>

              </template>
            </v-data-table>
          </v-col>
          <v-col cols="12">
            <v-alert
              color="green"
              type="warning"
            >Esse é um template exemplo de como podemos consultar
             dados de todos os usuários cadastrados na Organização. Consulte o código para saber mais.</v-alert>
          </v-col>

        </v-row>
      </v-tab-item>
      <v-tab-item :key="'2'">
        <v-col cols="12">
          <v-alert
            color="green"
            type="warning"
          >Esse é um template exemplo de como podemos consultar, adicionar, editar e deletar
            dados do firebase. Consulte o código para saber mais.</v-alert>
          <v-treeview
            open-all
            :items="itemsFirebase"
          ></v-treeview>
        </v-col>
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

export default {
  props: {
    date: String,
    dateTitle: String,
    group: Object,
    person: Object,
    reportType: String,
    step: Number
  },
  data () {
    return {
      tab: null,
      dialog: false,
      anotacao:'',
      itemsFirebase: [
        {
          id: 15,
          name: 'Downloads :',
          children: [
            { id: 16, name: 'October : pdf' },
            { id: 17, name: 'November : pdf' },
            { id: 18, name: 'Tutorial : html' },
          ],
        },
        {
          id: 19,
          name: 'Videos :',
          children: [
            {
              id: 20,
              name: 'Tutorials :',
              children: [
                { id: 21, name: 'Basic layouts : mp4' },
                { id: 22, name: 'Advanced techniques : mp4' },
                { id: 23, name: 'All about app : dir' },
              ],
            },
            { id: 24, name: 'Intro : mov' },
            { id: 25, name: 'Conference introduction : avi' },
          ],
        },
      ],
      headers: [
        { text: 'Usuário', align: 'start', value: 'name' },
        { text: 'CPF', value: 'cpf' },
        { text: 'Type', value: 'type' },
        { text: 'Anotações',align: 'center',value: 'anotacoes'},
      ],
      users: ''    
    }
  },
  computed: {
    usersComputed: function () {
      return this?.users ? this.users : []
    } 
  },
  methods: {
    openDialog(item){
      this.userSelected = item
      console.log("add firebase")
      console.log(item)
      this.dialog = true
    },
    async salvandoAnotacoes(item){
      console.log("salvou firebase")
      Quoti.firestoreData.collection("Anotacoes").add({
        id: this.userSelected.id,
        anotacoes: this.anotacao,
        
      }).then( (docRef) => {
        console.log("Document written with ID: ", docRef.id);
        this.dialog = false
      })
      
    }
  },
  async created() {
    console.log('The this is: ', this)
    console.log('The Quoti axios: ', Quoti.axios)
    console.log('The Quoti moment: ', Quoti.moment)
    //usando userApi
    const result = await Quoti.userApi.list({
      types: undefined
    })
    console.log(this.users)
    this.users = result
    console.log(result)
    console.log(this.users)

    // usando o firebase
    
  }
}
</script>



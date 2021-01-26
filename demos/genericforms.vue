<template>
  <v-container
    fluid
    style="background-color: #f0ebf8"
    fill-height
    class="pa-0 d-flex align-start"
  >
    <v-tabs v-model="tab" align-with-title>
      <v-tabs-slider color="black"></v-tabs-slider>
      <v-tab :key="'1'">
        <span> Perguntas </span>
      </v-tab>
      <v-tab :key="'2'">
        <span> Respostas </span>
      </v-tab>
      <v-tabs-items v-model="tab">
        <v-tab-item :key="'1'">
          <v-row class="pt-5">
            <v-col cols="12" style="background-color: #f0ebf8">
              <v-card
                style="
                  border-radius: 8px;
                  border: 1px solid #dadce0;
                  border-top: #673ab7 10px solid;
                "
                rounded
                class="mx-auto"
                max-width="770"
                elevation="0"
              >
                <v-card-title class="pb-0">
                  <v-text-field
                    hide-details
                    style="
                      font-size: 32px;
                      font-weight: 400;
                      line-height: 40px;
                      color: #202124;
                      line-height: 135%;
                    "
                    color="purple darken-2"
                    value="Formulario sem titulo"
                  ></v-text-field
                ></v-card-title>
                <v-card-text>
                  <v-text-field
                    class="pt-0"
                    style="
                      font-size: 14px;
                      font-weight: 400;
                      letter-spacing: 0.2px;
                      line-height: 20px;
                      color: #202124;
                      -webkit-box-sizing: border-box;
                      box-sizing: border-box;
                      line-height: 135%;
                    "
                    color="purple darken-2"
                    value="Descricao do formulario"
                  ></v-text-field>
                </v-card-text>
                <v-card-actions> </v-card-actions>
              </v-card>
            </v-col>
            <v-col cols="12" style="background-color: #f0ebf8">
              <draggable
                v-model="form.items"
                group="people"
                @start="drag=true"
                @end="drag=false"
                handle=".handle"
              >
                <v-row
                  v-for="(item,itemindex) in form.items"
                  :key="'question'+itemindex">
                 <v-col
                 cols="12"
                >
                  <v-card
                    :style="selectedFormItem === item.id ? 'border-radius:8px;border:1px solid #dadce0;' : 'border-radius:8px;border:1px solid #dadce0;'"
                    rounded
                    class="mx-auto"
                    max-width="770"
                    elevation="0"
                  >
                    <v-card-title class="py-1">
                      <v-row>
                        <v-col cols="12" class="py-0">
                          <div style="text-align: center; width:100%;">
                          <v-icon class="handle"> mdi-drag-horizontal </v-icon>
                          </div>
                        </v-col>
                        <v-col cols="12" sm="8" class="pt-0">
                          <v-text-field
                            hide-details
                            single-line
                            filled
                            style="
                              font-size: 16px;
                              font-weight: 500;
                              letter-spacing: 0.1px;
                              line-height: 24px;
                              font-weight: 400;
                            "
                            color="purple darken-2"
                            append-outer-icon="mdi-image-outline"
                            v-model="item.text"
                          ></v-text-field></v-col>
                        <v-col cols="8" sm="4" class="pt-0">
                          <v-select
                              height=46
                              hide-details
                              outlined
                              single-line
                              v-model="item.type"
                              :items="itemTypes"
                              item-value="value"
                              label="Tipo de pergunta"
                            >
                              <template v-slot:selection="data">
                                <v-row align="center" no-gutters>
                                  <v-col cols="auto"><v-icon class="mr-2" v-text="data.item.icon"></v-icon></v-col>
                                  <v-col>{{data.item.text}}</v-col>
                                </v-row>
                              </template>
                              <template v-slot:item="data">
                                  <v-list-item-icon class="mr-2">
                                    <v-icon v-text="data.item.icon"></v-icon>
                                  </v-list-item-icon>
                                  <v-list-item-content>
                                    <v-list-item-title v-text="data.item.text"></v-list-item-title>
                                  </v-list-item-content>
                              </template>
                          </v-select>
                          </v-col>
                          </v-row>
                          </v-card-title>
                    <v-card-text class="pl-0">
                      <draggable
                        v-model="item.choices"
                        group="people"
                        @start="drag=true"
                        @end="drag=false"
                        handle=".handle"
                      >
                        <template v-for="(choice, index) in item.choices">
                          <v-hover v-slot="{ hover }" :key="index+'choice'">
                            <v-text-field
                              hide-details
                              style="
                                font-size: 14px;
                                font-weight: 400;
                                letter-spacing: 0.2px;
                                line-height: 20px;
                                color: #202124;
                                background-color: white;
                              "
                              color="purple darken-2"
                              v-model="choice.text"
                              append-outer-icon="mdi-close"
                              @click:append-outer="removeChoice(index, item)"
                            >
                              <template v-slot:prepend>
                                <v-icon
                                  class="handle"
                                  :style=" hover ? 'font-size: 20px;color:black;' : 'font-size: 20px;color:white;'"
                                >
                                  mdi-drag-vertical
                                </v-icon>
                                <v-icon>
                                  mdi-checkbox-blank-circle-outline
                                </v-icon>
                              </template>
                            </v-text-field>
                          </v-hover>
                        </template>
                      </draggable>

                      <v-radio
                        class="pl-5 mt-5"
                        style="color: #202124; font-weight: 400"
                        @click="addChoice(item)"
                      >
                        <template v-slot:label>
                          <div>
                            Adicionar opcao ou
                            <strong style="color: #1a73e8"
                              >adicionar "Outro"</strong
                            >
                          </div>
                        </template>
                      </v-radio>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn @click="duplicateItem(itemindex)" icon color="grey">
                        <v-icon>mdi-content-duplicate</v-icon>
                      </v-btn>
                      <v-btn @click="removeItem(itemindex)" icon color="grey">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                      <v-divider
                        inset
                        vertical
                        class="mx-5"
                        style="max-height: 36px; margin-top: 15px"
                      ></v-divider>
                      <v-switch inset :label="`Obrigatoria`"></v-switch>
                      <v-btn icon color="grey">
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                 </v-col>
                </v-row>
              </draggable>
            </v-col>
            <!-- <v-col cols="12">
              <v-alert
                color="black"
                type="warning"
              >Esse é um template exemplo de como podemos consultar
              dados de todos os usuários cadastrados na Organização usando a API Quoti. Consulte o código para saber mais.</v-alert>
            </v-col> -->
          </v-row>
        </v-tab-item>
        <v-tab-item :key="'2'"> Respostas aqui </v-tab-item>
      </v-tabs-items>
    </v-tabs>
    <v-fab-transition>
      <v-btn @click="addItem" color="purple" fixed fab large dark bottom right>
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>
  </v-container>
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
      selectedFormItem: 0,
      itemTypes: [
        {text: 'Resposta curta', value: 'text', icon: 'mdi-text-short'},
        {text: 'Paragrafo', value: 'textarea', icon: 'mdi-text'},
        {text: 'Multipla Escolha', value: 'multiplechoice', icon: 'mdi-adjust'},
        {text: 'Caixas de selecao' , value: 'selections', icon: 'mdi-checkbox-marked'}
      ],
      form: {
        items: [
          {
            id: 0,
            type: 'multiplechoice',
            text: 'Pergunta sem titulo',
            choices: [
              {
                id: 11,
                text: 'Opção 1',
                value: 'Opção 1'
              }
            ]
          }
        ]
      },
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
    preventChoiceClick(event) {
      event.stopPropagation()
      event.preventDefault()
    },
    removeChoice(index, item){
      item.choices.splice(index, 1)
    },
    duplicateItem(index){
      let item = JSON.stringify(this.form.items[index])
      this.form.items.splice(index, 0, JSON.parse(item))
    },
    removeItem(index){
      this.form.items.splice(index, 1)
    },
    addItem() {
      this.form.items.push({
        id: 0,
        type: 'multiplechoice',
        text: this.getNewQuestionText(this.form.items),
        choices: []
      })
      this.addChoice(this.form.items[this.form.items.length-1])
    },
    addChoice(item){
      item.choices.push({
                id: null,
                text: this.getNewChoiceText(item.choices),
                value: null
              })
    },
    getNewChoiceText(choices){
      let count = 1
      let text = 'Opção '+count
      let founded = choices.find((c) => c.text === text)
      while(founded){
        count++
        text = 'Opção '+count
        founded = choices.find((c) => c.text === text)
      }
      return text
    },
    getNewQuestionText(items){
      let count = 1
      let text = 'Pergunta sem titulo '+count
      let founded = items.find((c) => c.text === text)
      while(founded){
        count++
        text = 'Pergunta sem titulo '+count
        founded = items.find((c) => c.text === text)
      }
      return text
    },
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



<template>
  <div>
    <h2>Gerenciador de senhas</h2>
    <div v-if="initialloading" class="text-center">
    <v-progress-circular
      indeterminate
      color="primary"
    ></v-progress-circular></div>
    <div v-else>
      <v-tabs
    v-model="tab"
    align-with-title
  >
    <v-tabs-slider color="blue"></v-tabs-slider>
    <v-tab :key="'1'">
      <span> Minhas senhas </span>
    </v-tab>
    <v-tab v-if="me && me.type === 'admin'" :key="'2'">
      <span> Enviar senhas em lote </span>
    </v-tab>
    <v-tabs-items v-model="tab" class="mt-5">
      <v-tab-item :key="'1'">
        <v-alert
              color="green"
              type="warning"
            >Sempre que alterar alguma senha, lembre-se de salva-la novamente aqui para que possa encontrar com facilidade em outro momento.<br/>
            Se estiver com dificuldades para acesssar algum dos servicos, entre em contato com a escola.
            </v-alert>
    <v-col
            v-for="(item, i) in senhas"
            :key="i"
            cols="12"
          >
            <v-card
            >
              <div class="d-flex flex-no-wrap justify-space-between">
                <div>
                  <v-card-title
                    class="headline"
                    v-text="item.name"
                  ></v-card-title>

                  <v-card-subtitle>
                    Usuário: <b>{{item.user}}</b>
                    <br/>
                    Senha: <b>{{item.pass}}</b>
                  </v-card-subtitle>

                  <v-card-actions>
                    <v-btn
                      @click="openDialogToChangePass(item)"
                      class="ml-2 mt-5"
                      color="purple"
                      text
                      small
                    >
                      Alterar senha
                    </v-btn><v-btn
                      class="ml-2 mt-5"
                      color="green"
                      text
                      small
                    >
                      Copiar senha
                    </v-btn>
                    <v-btn
                      @click="window.open(item.loginUrl, '_blank')"
                      class="ml-2 mt-5"
                      color="blue"
                      text
                      small
                    >
                      Entrar
                    </v-btn>
                  </v-card-actions>
                </div>

                <v-avatar
                  class="ma-3"
                  size="125"
                  tile
                >
                  <v-img contain :src="item.logo"></v-img>
                </v-avatar>
              </div>
            </v-card>
          </v-col>
      </v-tab-item>
      <v-tab-item :key="'2'">
        <h4>Nova carga de senhas</h4>
      <h5>Aviso: A planilha deve conter 3 colunas na seguinte ordem: Usuario no Quoti, Usuario no servico, Senha.</h5>
      <v-form
        ref="form"
      >
        <v-text-field
          v-model="newservice.name"
          :counter="20"
          label="Nome do servico"
          required
        ></v-text-field>

        <v-text-field
          v-model="newservice.logo"
          label="Logo"
          required
        ></v-text-field>

        <v-text-field
          v-model="newservice.loginUrl"
          label="Link para acesso"
          required
        ></v-text-field>

        <v-file-input
          label="Selecione o arquivo .CSV"
          counter
          show-size
          truncate-length="15"
          v-model="newservice.files"
        ></v-file-input>
        <v-btn
          color="success"
          class="mr-4"
          @click="saveNewService"
          :loading="loadingNewService"
        >
          ENVIAR
        </v-btn>

      </v-form>
      </v-tab-item>
    </v-tabs-items>
    </v-tabs>
    
    </div>
  <v-dialog
          v-model="newservice.dialog.active"
          width="500"
        >
          <v-card v-if="newservice && newservice.dialog">
            <v-card-title class="headline">
              Nova carga
            </v-card-title>
            <v-card-text>{{newservice.dialog.msg}}</v-card-text>
             <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                text
                @click="newservice.dialog.active = false"
                :loading="loadingNewService"
              >
                Fechar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
             <v-dialog
          v-model="dialog"
          width="500"
        >
          <v-card v-if="selectedService">
            <v-card-title class="headline">
              Alterar senha de {{selectedService.name}}
            </v-card-title>
            <v-card-text>Voce salvara a mudanca de senha para esse servico.</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-text-field
                v-model="selectedService.pass"
                label="Nova senha"
                outlined
              ></v-text-field>
              <v-spacer></v-spacer>
              <v-btn
                text
                @click="savePassword()"
              >
                Salvar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
  </div>
</template>
<script>
const Quoti = {
  axios: config.axios,
  moment: moment,
  firestoreData: Firestore.collection(`/dynamicComponents/${id}/data/`).doc(
    "collections"
  ),
  organizationApi: Organization,
  userApi: User,
  presenceApi: Presence,
  gradesApi: Grades,
  catracaApi: Catraca,
  postApi: Post,
  notificationsApi: Notifications,
};

export default {
  props: {
    date: String,
    dateTitle: String,
    group: Object,
    person: Object,
    reportType: String,
    step: Number,
  },
  data() {
    return {
      initialloading: true,
      loadingNewService: false,
      me: null,
      senhas: [
        // {
        //   name: 'Google Classroom',
        //   logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Google_Classroom_icon.svg/1186px-Google_Classroom_icon.svg.png",
        //   user: "levi@dombarreto.g12.br",
        //   pass: "MeMude123",
        //   loginUrl: "https://classroom.google.com/a/dombarreto.g12.br",
        //   tutoriaisUrl: null
        // }
      ],
      newservice: {
          name: '',
          logo: "",
          user: "",
          pass: "",
          loginUrl: "",
          tutoriaisUrl: null,
          files: [],
          dialog: {
            active: false,
            msg: ''
          }
      },
      tab: null,
      selectedService: null,
      dialog: false,
    };
  },
  computed: {
    usersComputed: function () {
      return this?.users ? this.users : [];
    },
  },
  methods: {
    openDialog(item) {
      this.userSelected = item;
      console.log("add firebase");
      console.log(item);
      this.dialog = true;
    },
    async saveNewService() {
      try{
        let notfound_users = []
        this.loadingNewService = true
        this.newservice.dialog.msg = "Obtendo todos os usuarios.."
        this.newservice.dialog.active = true
        console.log(this.newservice)
        const usuariosDb = await Quoti.userApi.list({
          types: undefined
        })
        console.log('allUsersCSV', (usuariosDb.map(u => u.user+','+u.email)).join('\n'))
        console.log(usuariosDb)
        console.log(this.newservice.files)
        this.newservice.dialog.msg = "Lendo o arquivo.."
        let data = await this.readCSVFile(this.newservice.files)
        console.log('data', data)
        data.forEach((u, index) => {
          this.newservice.dialog.msg = "Salvando usuario "+(index+1)+" de "+ data.length
          let udb = usuariosDb.find((usr) => usr.user === u[0])
          if(udb && udb.uuid) {
            console.log('Iremos setar para o usuario', udb, udb.uuid)
            Quoti.firestoreData
            .collection("users")
            .doc(udb.uuid)
            .collection("senhas")
            .doc(this.newservice.name)
            .set({
              name: this.newservice.name,
              logo: this.newservice.logo,
              user: u[1],
              pass: u[2],
              loginUrl: this.newservice.loginUrl ,
              tutoriaisUrl: null
            }, { merge: true })
          } else {
            notfound_users.push(u[0])
          }
        })
        this.loadingNewService = false
        if(notfound_users.length == 0)
          this.newservice.dialog.msg = "Finalizado. Todos os usuarios foram salvos." 
        else
          this.newservice.dialog.msg = "Finalizado. Os usuarios: "+notfound_users.join(', ')+" nao foram encontrados." 
      } catch(e) {
        console.error(e)
        this.loadingNewService = false
        this.newservice.dialog.msg = 'ERRO:'+e.message
      }
      
    },
    readCSVFile(file) {
      return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function(e) {
          var contents = e.target.result;
          console.log('Conteudo do CSV:' , contents)
          let header = contents.split('\n')[0].split(',')
          let rows = contents.split('\n').slice(1).map((r) => {
            return r.split(',')
          })
          resolve(rows)
        };
        reader.readAsText(file)
      })
    },
    async loadSenhas() {
        Quoti.firestoreData.collection("users").doc(this.me.uuid).collection("senhas").get().then( (docs) => {
          console.log("Query:", docs);
          console.log("Foram encontrados ", docs.size);
          if (docs.size > 0) {
            this.senhas = docs.docs.map((d) => d.data());
          }
        });
    },
    async savePassword() {
      console.log("salvou firebase");
          Quoti.firestoreData.collection("users").doc(this.me.uuid).collection("senhas").doc(this.selectedService.name).set(this.selectedService, {merge: true}).then( (docRef) => {
          // console.log("Document written with ID: ", docRef.id);
          this.dialog = false;
        });
    },
    openDialogToChangePass(item) {
      this.selectedService = item;
      this.dialog = true;
    },
  },
  async created() {
    console.log("The this is: ", this);
    console.log("The Quoti axios: ", Quoti.axios);
    console.log("The Quoti moment: ", Quoti.moment);
    this.me = await Quoti.userApi.getMe();
    console.log(`This is me:`, this.me);
    this.loadSenhas();
    this.initialloading = false
    //usando userApi
    // const result = await Quoti.userApi.list({
    //   types: undefined
    // })
    // console.log(this.users)
    // this.users = result
    // console.log(result)
    // console.log(this.users)

    // usando o firebase
  },
};
</script>



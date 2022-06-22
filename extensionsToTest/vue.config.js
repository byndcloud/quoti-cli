const path = require('path')

console.log('Modo de build: ', process.env.NODE_ENV)

module.exports = {
  runtimeCompiler: true,
  parallel: true,
  publicPath: process.env.VUE_APP_CORDOVA ? '' : '/',
  lintOnSave: true,
  transpileDependencies: ['vue-clamp', 'resize-detector'],
  // css: {
  //   loaderOptions: {
  //     sass: {
  //       additionalData: `@import '~vuetify/src/styles/styles.sass'\n@import "@/styles/variables.scss"`
  //     },
  //     scss: {
  //       additionalData: `@import '~vuetify/src/styles/styles.sass'; @import "@/styles/variables.scss";`
  //     }
  //   }
  // },
  configureWebpack: {
    devtool: false,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/')
        // './locale': 'moment/locale'
      }
    },
    entry: [
      'core-js/modules/es.promise',
      'core-js/modules/es.array.iterator',
      path.resolve(__dirname, 'src/main.js')
    ]

    // plugins: [new VuetifyLoaderPlugin()]
  },

  chainWebpack: config => {
    config.plugins.delete('prefetch')

    // const modules = ['vue-modules', 'vue', 'normal-modules', 'normal']
    // modules.forEach(match => {
    //   config.module
    //     .rule('sass')
    //     .oneOf(match)
    //     .use('sass-loader')
    //     .tap(opt => {
    //       console.log(opt.additionalData)
    //       return opt
    //     })
    //   // .tap(opt => mergeSassVariables(opt, `'@/styles/variables.scss'`))
    //   config.module
    //     .rule('scss')
    //     .oneOf(match)
    //     .use('sass-loader')
    //     .tap(opt => {
    //       console.log(opt.additionalData)
    //       return opt
    //     })
    //   // .tap(opt => mergeSassVariables(opt, `'@/styles/variables.scss';`))
    // })

    const svgRule = config.module.rule('svg')

    svgRule.uses.clear()

    svgRule
      .oneOf('inline')
      .resourceQuery(/inline/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
      .end()
      .end()
      .oneOf('external')
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]'
      })
  },

  pwa: {
    name: 'App Quo',
    themeColor: '#2196F3',
    msTileColor: '#4DBA87',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    // configure the workbox plugin
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'dev/sw.js'
      // ...other Workbox options...
    }
  },

  pluginOptions: {
    cordovaPath: 'cordova'
  }
}

module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      {
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  // plugins: [
  //   '@babel/plugin-proposal-class-properties',
  //   ['@babel/transform-runtime', { corejs: 3 }]
  // ]
}

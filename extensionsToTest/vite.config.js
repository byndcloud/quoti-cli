import path from 'path'

export default {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/')
    },
    extensions: ['.vue', '.js', '.ts', '.tsx', '.jsx']
  }
}

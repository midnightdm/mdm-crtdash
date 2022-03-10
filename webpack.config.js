const path = require('path');
//const RemoveStrictPlugin = require('remove-strict-webpack-plugin');

module.exports = {
  // plugins: [
  //   new RemoveStrictPlugin()
  // ],
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  watch: true,

}
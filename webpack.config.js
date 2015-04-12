'use strict';

var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry : [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/dev-server',
    path.join(__dirname, 'app/main')
  ],
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'main.bundle.js'
  },
  resolve: {
    moduleDirectories: [path.join(__dirname, 'node_modules')],
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      { test: /^(?!.*node_modules)+.+\.js$/, loader: 'babel-loader?sourceMap' }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};
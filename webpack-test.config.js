'use strict';

var path = require('path');
var RewirePlugin = require('rewire-webpack');

module.exports = {
  devtool: 'source-map',
  resolve: {
    moduleDirectories: [path.join(__dirname, 'node_modules')],
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      { test: /^(?!.*(bower_components|node_modules))+.+\.js$/, loader: 'babel-loader?sourceMap' }
    ]
  },
  plugins: [
    new RewirePlugin()
  ]
};
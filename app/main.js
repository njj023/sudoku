// Import ES6 polyfills from babel.
require('babel/polyfill');

const App = require('./views/app');

const content = document.getElementById('content');

const foo = new App().render().container;

content.appendChild(foo);

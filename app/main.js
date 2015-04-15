/**
 * Root file of the entire application.
 */

// Import ES6 polyfills from babel.
require('babel/polyfill');

// Get the parent view for the entire app.
const App = require('./views/app');

// Get access to the DOM element where all content will go into.
const content = document.getElementById('content');

// Call render() on the app view to get hold of its contents
const AppContainer = new App().render().container;

// Insert the contents
content.appendChild(AppContainer);

//ES6 polyfills
require('babel/polyfill');

// Test game service
require('./services/__tests__/game-test');

// Test the three views
require('./views/__tests__/app-test');
require('./views/__tests__/grid-test');
require('./views/__tests__/cell-test');


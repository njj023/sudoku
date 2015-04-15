const EventEmitter = require('events').EventEmitter;

const GameDispatcher = new EventEmitter();

// Increase listener count to incorporate the 81 cells we have.
GameDispatcher.setMaxListeners(100);

module.exports = GameDispatcher;
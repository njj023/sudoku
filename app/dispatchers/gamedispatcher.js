/**
 * The GameDispatcher is the primary pub-sub emitter for communication
 *   between the UI and the "backend" i.e. the Game service.
 */

const EventEmitter = require('events').EventEmitter;

const GameDispatcher = new EventEmitter();

// Increase listener count to incorporate the 81 cells we have.
GameDispatcher.setMaxListeners(100);

module.exports = GameDispatcher;
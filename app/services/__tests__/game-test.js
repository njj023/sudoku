/* global describe,it,expect,beforeEach */
const rewire = require('rewire');
const EventEmitter = require('events').EventEmitter;

const GameConstants = require('../../constants/gameconstants');

//Rewire Game to replace dependencies with our own mocks
const Game = rewire('../game');

describe('Game service tests', () => {
  let mockDispatcher = new EventEmitter();
  Game.__set__('GameDispatcher', mockDispatcher);

  let game;
  beforeEach(() => {
    game = new Game();
  });

  it('should create valid length grids', () => {
    const grids = game.getGrids();
    expect(grids.size).toEqual(9);
  });

  it('should create game with won set to false', () => {
    expect(game.won).toEqual(false);
  });

  it('should initialize all rows to be valid', () => {
    const rows = game.getRows();

    expect(rows.size).toEqual(9);
    expect(rows.every(row => true));
  });

  it('should initialize all columns to be valid', () => {
    const columns = game.getColumns();

    expect(columns.size).toEqual(9);
    expect(columns.every(column => true));
  });

  it('should update cell on CELL_UPDATE event', () => {
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 1, 2, 6);

    const updatedGrids = game.getGrids();
    expect(updatedGrids.getIn(['1', 'cells', '2', 'value'])).toEqual(6);
  });

  it('should set grid as invalid with duplicate number', () => {
    // Set a cell to a value already present in the preset grid
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 1, 2, 7);

    const updatedGrids = game.getGrids();
    expect(updatedGrids.getIn(['1', 'isValid'])).toEqual(false);
  });

  it('should reset grid as valid after removing invalid number', () => {
    // Set a cell to a value already present in the preset grid
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 1, 2, 7);

    // Remove duplicate value
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 1, 2, null);


    const updatedGrids = game.getGrids();
    expect(updatedGrids.getIn(['1', 'isValid'])).toEqual(true);
  });

  it('should set grid as complete after adding all values', () => {
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 2, 4);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 4, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 5, 1);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 6, 2);

    const updatedGrids = game.getGrids();
    expect(updatedGrids.getIn(['0', 'isComplete'])).toEqual(true);
  });

  it('should set grid as NOT complete after adding duplicate values', () => {
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 2, 4);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 4, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 5, 7);   // Dupe value
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 6, 2);

    const updatedGrids = game.getGrids();
    expect(updatedGrids.getIn(['0', 'isComplete'])).toEqual(false);
  });

  it('should set emit INVALIDATE_CELLS event after adding duplicate values', (done) => {
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 2, 4);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 4, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 6, 2);

    mockDispatcher.addListener(GameConstants.INVALIDATE_CELLS, (gridIDs, cellIDs, dupeValue) => {
      expect(gridIDs.toJS()).toEqual([0]);
      expect(cellIDs.toJS()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(dupeValue).toEqual(7);

      mockDispatcher.removeAllListeners(GameConstants.INVALIDATE_CELLS);
      done();
    });

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 5, 7);   // Dupe value
  });

  it('should compute correct row ids for given grid and cell id', () => {
    // Sample different parts of the grid
    expect(game.getRowID(0, 1)).toEqual(0);
    expect(game.getRowID(1, 5)).toEqual(1);
    expect(game.getRowID(5, 0)).toEqual(3);
    expect(game.getRowID(8, 7)).toEqual(8);
  });

  it('should compute correct column ids for given grid and cell id', () => {
    // Sample different parts of the grid
    expect(game.getColumnID(0, 0)).toEqual(0);
    expect(game.getColumnID(1, 4)).toEqual(4);
    expect(game.getColumnID(5, 0)).toEqual(6);
    expect(game.getColumnID(8, 8)).toEqual(8);
  });

  it('should set row to valid after adding all non duplicate entries in the row', () => {
    // We will update the 2nd row in the wiki board
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 4, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 5, 8);

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 3, 2);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 4, 3);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 5, 4);

    expect(game.getRows().get(1)).toEqual(true);
  });

  it('should set row to NOT valid after adding duplicate entries in the row', () => {
    // We will update the 2nd row in the wiki board
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 4, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 5, 8);

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 3, 2);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 4, 3);

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 5, 7);   // Dupe with grid 0 and cell 4

    expect(game.getRows().get(1)).toEqual(false);
  });

  it('should emit INVALIDATE_CELLS event after adding duplicate entries in the row', (done) => {
    // We will update the 2nd row in the wiki board
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 4, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 0, 5, 8);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 3, 2);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 4, 3);

    mockDispatcher.addListener(GameConstants.INVALIDATE_CELLS, (gridIDs, cellIDs, dupeValue) => {
      expect(gridIDs.toJS()).toEqual([0, 1, 2]);
      expect(cellIDs.toJS()).toEqual([3, 4, 5]);
      expect(dupeValue).toEqual(7);

      mockDispatcher.removeAllListeners(GameConstants.INVALIDATE_CELLS);
      done();

    });

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 5, 7);   // Dupe with grid 0 and cell 4

    expect(game.getRows().get(1)).toEqual(false);
  });

  it('should set column to valid after adding all non duplicate entries in the column', () => {
    // We will update the last column in the wiki board
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 2, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 5, 8);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 8, 2);

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 8, 2, 4);

    expect(game.getColumns().get(8)).toEqual(true);
  });

  it('should set column to NOT valid after adding duplicate entries in the column', () => {
    // We will update the last column in the wiki board
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 2, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 5, 8);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 8, 2);

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 8, 2, 3); // Dupe with grid 5 cell 2

    expect(game.getColumns().get(8)).toEqual(false);
  });

  it('should emit INVALIDATE_CELLS event after adding duplicate entries in the column', (done) => {
    // We will update the last column in the wiki board
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 2, 7);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 5, 8);
    mockDispatcher.emit(GameConstants.CELL_UPDATE, 2, 8, 2);

    mockDispatcher.addListener(GameConstants.INVALIDATE_CELLS, (gridIDs, cellIDs, dupeValue) => {
      expect(gridIDs.toJS()).toEqual([2, 5, 8]);
      expect(cellIDs.toJS()).toEqual([2, 5, 8]);
      expect(dupeValue).toEqual(3);

      mockDispatcher.removeAllListeners(GameConstants.INVALIDATE_CELLS);
      done();

    });

    mockDispatcher.emit(GameConstants.CELL_UPDATE, 8, 2, 3); // Dupe with grid 5 cell 2

    expect(game.getRows().get(1)).toEqual(false);
  });


});



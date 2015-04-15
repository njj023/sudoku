const Immutable = require('immutable');
const EventEmitter = require('events').EventEmitter;

const GameDispatcher = require('../dispatchers/gamedispatcher');
const GameConstants = require('../constants/gameconstants');
const GameModeConstants = require('../constants/gamemodeconstants');

/**
 * Simple helper to validate that cell value is a digit from 1 - 9
 * @param value
 */
function validate(cellValue) {
  return Number.isInteger(cellValue) && cellValue > 0 && cellValue < 10;
}

// Create [0, 1, 2, 3,..., 9]
const ALL_CELL_IDS = Immutable.fromJS(Array.from({length: 9}, (_, index) => index));

/**
 * Game service that handles all states pertaining to a single instance of Sudoku.
 */
class Game {
  /**
   * Constructor that initializes the game state.
   * @param gameMode the game mode (default is PRESET).
   */
  constructor(gameMode=GameModeConstants.PRESET) {
    this.isValid = true;
    this.won = false;
    this.mode = gameMode;

    this.grids = this.initializeGrids();

    // Bit arrays storing an isValid bit for each row and column in the grid
    // Initially all columns and rows are valid.
    this.rows = Array.from({length: 9}, () => true);
    this.columns = Array.from({length: 9}, () => true);


    this.setInitialCellValues(gameMode);

    GameDispatcher.on(GameConstants.CELL_UPDATE, (...args) => this.setCell(...args));   // Arrow notation for proper scoping
  }

  /**
   * Initialize an empty set of 9 grids composed of 9 cells each.
   * @returns {Array} Array of 0-indexed grids.
   */
  initializeGrids() {
    return Array.from({length: 9}).map((_, gridID) => {
      const cells = Array.from({length: 9}).map(() => {
        return {
          gridID: gridID,
          editable: true,
          value: null
        };
      });

      return {
        cells: cells,
        isValid: true,
        isComplete: false
      };
    });
  }

  /**
   * Getter functions that returns an immutable copy of grids.
   * As such this.grids should only be accessed through this method.
   * @returns {object} Immutable copy of grids
   */
  getGrids() {
    return Immutable.fromJS(this.grids);
  }

  /**
   * Immutable copy of all rows
   */
  getRows() {
    return Immutable.fromJS(this.rows);
  }

  /**
   * Immutable copy of all columns
   */
  getColumns() {
    return Immutable.fromJS(this.columns);
  }

  /**
   * Depending on the game mode, this method pre-fills cells at the start of the game.
   * @param mode the game mode (default is PRESET).
   * @returns {}.
   */
  setInitialCellValues(mode) {
    switch(mode) {
      case GameModeConstants.PRESET:
        this.setPresetCellValues();
        break;
    }
  }

  /**
   * Set a given cell on the board. Instead of calling this method directly, all communication
   * such as this should be done through dispatch events (GameDispatcher).
   * @param gridID Valid ID of the grid.
   * @param cellID Valid cellID in the grid.
   * @param value New value of the cell.
   */
  setCell(gridID, cellID, value) {
    const cell = this.grids[gridID].cells[cellID];

    if (!cell.editable) {
      throw new Error('Non editable cells cannot be updated');
    }

    if (validate(value)) {
      cell.value = value;
    } else {
      cell.value = null;
    }

    this.checkGameStatus(gridID, cellID);
  }

  /**
   * Check to make sure the corresponding grid, row and column are valid. Finally also see if the
   * game is won.
   * @param gridID Recently updated grid
   * @param cellID Recently updated cell
   */
  checkGameStatus(gridID, cellID) {
    this.checkGrid(gridID);
    this.checkRow(gridID, cellID);
    this.checkColumn(gridID, cellID);
    this.checkGame();
  }

  /**
   * Iterate through the inserted numbers in the grid and emit INVALIDATE_CELLS event if duplicates found.
   * @param gridID Grid to check.
   */
  checkGrid(gridID) {
    let grid = this.grids[gridID];

    // Invalidate the grid later if duplicate numbers are to be found.
    grid.isValid = true;

    let numbers = new Set();

    for (let cell of grid.cells) {
      if (numbers.has(cell.value)) {
        grid.isValid = false;

        // Emit an INVALIDATE_CELLS event passing along the affected grids and cells and the duplicated value
        GameDispatcher.emit(GameConstants.INVALIDATE_CELLS, Immutable.fromJS([gridID]),
          ALL_CELL_IDS, cell.value);
      }

      if (cell.value !== null) {
        numbers.add(cell.value);
      }
    }

    // Mark the grid as complete if all numbers are found
    if (numbers.size === 9) {
      grid.isComplete = true;
    }
  }

  /**
   * Iterate through the corresponding row of <gridID, cellID>. Given that the data is stored as a list
   * of one dimensional grids, each of which contains a one dimensional list of cells, there is some computation
   * needed to determine the right row.
   * @param gridID
   * @param cellID
   */
  checkRow(gridID, cellID) {
    const rowID = this.getRowID(gridID, cellID);

    // Get the three adjacent gridIDs from left to right in the row
    const adjacentRowGridIDs = Array.from([0, 1, 2], x => (gridID - gridID % 3) + x);

    // Get the three adjacent cell IDs from left to right
    const adjacentCellIDs = Array.from([0, 1, 2], x => (cellID - cellID % 3) + x);

    let numbers = new Set();

    // Invalidate the row later if duplicate numbers are to be found.
    this.rows[rowID] = true;

    for (let rowGridID of adjacentRowGridIDs) {
      for (let rowCellID of adjacentCellIDs) {
        const value = this.grids[rowGridID].cells[rowCellID].value;

        // Duplicate found, so mark this row invalid
        if (numbers.has(value)) {
          this.rows[rowID] = false;

          // Emit an INVALIDATE_CELLS event passing along the affected grids and cells and the duplicated value
          GameDispatcher.emit(GameConstants.INVALIDATE_CELLS, Immutable.fromJS(adjacentRowGridIDs),
            Immutable.fromJS(adjacentCellIDs), value);
        }

        if (value !== null) {
          numbers.add(value);
        }
      }
    }
  }

  /**
   * Similar to checkRow, we need some computation to figure out a "column" across the various sequentially
   * laid out grids.
   * @param gridID
   * @param cellID
   */
  checkColumn(gridID, cellID) {
    const columnID = this.getColumnID(gridID, cellID);

    // Get the three adjacent gridIDs from top to bottom in the column
    const adjacentColumnGridIDs = Array.from([0, 1, 2], x => (gridID % 3) + (x * 3));

    // Get the three adjacent cell IDs from top to bottom
    const adjacentCellIDs = Array.from([0, 1, 2], x => (cellID % 3) + (x * 3));

    let numbers = new Set();

    // Invalidate the row later if duplicate numbers are to be found.
    this.columns[columnID] = true;

    for (let columnGridID of adjacentColumnGridIDs) {
      for (let columnCellID of adjacentCellIDs) {
        const value = this.grids[columnGridID].cells[columnCellID].value;

        // Duplicate found, so mark this column invalid
        if (numbers.has(value)) {
          // Emit an INVALIDATE_CELLS event passing along the affected grids and cells and the duplicated value
          GameDispatcher.emit(GameConstants.INVALIDATE_CELLS, Immutable.fromJS(adjacentColumnGridIDs),
            Immutable.fromJS(adjacentCellIDs), value);

          this.columns[columnID] = false;
        }

        if (value !== null) {
          numbers.add(value);
        }
      }
    }
  }

  /**
   * Checks if the game has been won. If so, emits the corresponding event.
   */
  checkGame() {
    const hasWon = this.grids.every(g => g.isComplete) &&
                   this.rows.every(r => r) &&
                   this.columns.every(c => c);

    if (hasWon) {
      this.won = true;
      GameDispatcher.emit(GameConstants.WON);
    }

  }

  /**
   * Get the 0 indexed row id when visualizing the game as a 2-D grid
   * @param gridId
   * @param cellID
   * @returns {number} The row id.
   */
  getRowID(gridId, cellID) {
    return (gridId - gridId % 3) + Math.floor(cellID / 3);
  }

  /**
   * Get the 0 indexed column id when visualizing the game as a 2-D grid
   * @param gridID
   * @param cellID
   * @returns {number}
   */
  getColumnID(gridID, cellID) {
    return ((gridID % 3) * 3) + (cellID % 3);
  }

  /**
   * Set initial cell values based on this wiki board:
   * http://en.wikipedia.org/wiki/File:Sudoku-by-L2G-20050714.svg
   */
  setPresetCellValues() {
    this.grids[0].cells[0] = {gridID: 0, editable: false, value: 5};
    this.grids[0].cells[1] = {gridID: 0, editable: false, value: 3};
    this.grids[0].cells[3] = {gridID: 0, editable: false, value: 6};
    this.grids[0].cells[7] = {gridID: 0, editable: false, value: 9};
    this.grids[0].cells[8] = {gridID: 0, editable: false, value: 8};

    this.grids[1].cells[1] = {gridID: 1, editable: false, value: 7};
    this.grids[1].cells[3] = {gridID: 1, editable: false, value: 1};
    this.grids[1].cells[4] = {gridID: 1, editable: false, value: 9};
    this.grids[1].cells[5] = {gridID: 1, editable: false, value: 5};

    this.grids[2].cells[7] = {gridID: 2, editable: false, value: 6};

    this.grids[3].cells[0] = {gridID: 3, editable: false, value: 8};
    this.grids[3].cells[3] = {gridID: 3, editable: false, value: 4};
    this.grids[3].cells[6] = {gridID: 3, editable: false, value: 7};

    this.grids[4].cells[1] = {gridID: 4, editable: false, value: 6};
    this.grids[4].cells[3] = {gridID: 4, editable: false, value: 8};
    this.grids[4].cells[5] = {gridID: 4, editable: false, value: 3};
    this.grids[4].cells[7] = {gridID: 4, editable: false, value: 2};

    this.grids[5].cells[2] = {gridID: 5, editable: false, value: 3};
    this.grids[5].cells[5] = {gridID: 5, editable: false, value: 1};
    this.grids[5].cells[8] = {gridID: 5, editable: false, value: 6};

    this.grids[6].cells[1] = {gridID: 6, editable: false, value: 6};

    this.grids[7].cells[3] = {gridID: 7, editable: false, value: 4};
    this.grids[7].cells[4] = {gridID: 7, editable: false, value: 1};
    this.grids[7].cells[5] = {gridID: 7, editable: false, value: 9};
    this.grids[7].cells[7] = {gridID: 7, editable: false, value: 8};

    this.grids[8].cells[0] = {gridID: 8, editable: false, value: 2};
    this.grids[8].cells[1] = {gridID: 8, editable: false, value: 8};
    this.grids[8].cells[5] = {gridID: 8, editable: false, value: 5};
    this.grids[8].cells[7] = {gridID: 8, editable: false, value: 7};
    this.grids[8].cells[8] = {gridID: 8, editable: false, value: 9};
  }
}

module.exports = Game;

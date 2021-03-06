const Immutable = require('immutable');
const objectAssign = require('object-assign');

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

/**
 * Game service that handles all states pertaining to a single instance of Sudoku.
 */
class Game {
  /**
   * Constructor that initializes the game state.
   * @param gameMode The game mode (default is PRESET but eventually I want to add random board generation).
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

    GameDispatcher.on(GameConstants.CELL_UPDATE, (...args) => this.setCell(...args));
  }

  /**
   * Initialize an empty set of 9 grids composed of 9 cells each.
   * @returns {Array} Array of 0-indexed grids.
   */
  initializeGrids() {
    return Array.from({length: 9}).map((_, gridID) => {
      const cells = Array.from({length: 9}).map((_, cellID) => {
        return {
          gridID: gridID,
          rowID: this.getRowID(gridID, cellID),
          columnID: this.getColumnID(gridID, cellID),
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
   * Getter function that returns an immutable copy of grids.
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

    let prevValue = cell.value;

    if (!cell.editable) {
      throw new Error('Non editable cells cannot be updated');
    }

    if (validate(value)) {
      cell.value = value;
    } else {
      cell.value = null;
    }

    this.checkGameStatus(gridID, cellID, prevValue);
  }

  /**
   * Check to make sure the corresponding grid, row and column are valid. Finally also see if the
   * game is won.
   * @param gridID Recently updated grid
   * @param cellID Recently updated cell
   */
  checkGameStatus(gridID, cellID, prevValue) {
    this.checkGrid(gridID, prevValue);
    this.checkRow(gridID, cellID, prevValue);
    this.checkColumn(gridID, cellID, prevValue);
    this.checkGame();
  }

  /**
   * Iterate through the inserted numbers in the grid and emit INVALIDATE_GRID event if duplicates found.
   * @param gridID Grid to check.
   */
  checkGrid(gridID, prevValue) {
    let grid = this.grids[gridID];

    // Invalidate the grid later if duplicate numbers are to be found.
    grid.isValid = true;

    // Use a hash set to keep track of numbers so we get an O(1) lookup while checking for duplicates.
    let numbers = new Set();

    let prevValueCounter = 0;

    for (let cell of grid.cells) {
      if (cell.value === prevValue) {
        prevValueCounter += 1;
      }

      if (numbers.has(cell.value)) {
        grid.isValid = false;

        // Emit an INVALIDATE_GRID event passing along the affected grid and the duplicated value
        GameDispatcher.emit(GameConstants.INVALIDATE_GRID, gridID, cell.value);
      }

      if (cell.value !== null) {
        numbers.add(cell.value);
      }
    }

    // Mark the grid as complete if all numbers are found
    if (numbers.size === 9) {
      grid.isComplete = true;
    }

    // If only 0 or 1 cells with prevValue were found, this grid is valid now for that particular value
    if (prevValueCounter <= 1) {
      GameDispatcher.emit(GameConstants.VALIDATE_GRID, gridID, prevValue);
    }
  }

  /**
   * Iterate through the corresponding row of <gridID, cellID>. Given that the data is stored as a list
   * of one dimensional grids,, there is some computation
   * needed to determine the right row.
   * @param gridID
   * @param cellID
   * @param prevValue The previous value the cell pointed to before getting updated. This allows us to validate any
   *        prior cells that were invalid before but maybe valid now.
   */
  checkRow(gridID, cellID, prevValue) {
    const rowID = this.getRowID(gridID, cellID);

    // Get the three adjacent gridIDs from left to right in the row
    const adjacentRowGridIDs = Array.from([0, 1, 2], x => (gridID - gridID % 3) + x);

    // Get the three adjacent cell IDs from left to right
    const adjacentCellIDs = Array.from([0, 1, 2], x => (cellID - cellID % 3) + x);

    let numbers = new Set();
    let prevValueCounter = 0;

    // Invalidate the row later if duplicate numbers are to be found.
    this.rows[rowID] = true;

    for (let rowGridID of adjacentRowGridIDs) {
      for (let rowCellID of adjacentCellIDs) {
        const value = this.grids[rowGridID].cells[rowCellID].value;

        if (value === prevValue) {
          prevValueCounter += 1;
        }

        // Duplicate found, so mark this row invalid
        if (numbers.has(value)) {
          this.rows[rowID] = false;

          // Emit an INVALIDATE_ROW event passing along the affected row and the duplicated value
          GameDispatcher.emit(GameConstants.INVALIDATE_ROW, rowID, value);
        }

        if (value !== null) {
          numbers.add(value);
        }
      }
    }

    // If only 0 or 1 cells with prevValue were found, this row is valid now for that particular value
    if (prevValueCounter <= 1) {
      GameDispatcher.emit(GameConstants.VALIDATE_ROW, rowID, prevValue);
    }
  }

  /**
   * Similar to checkRow, we need some computation to figure out a "column" across the various sequentially
   * laid out grids.
   * @param gridID
   * @param cellID
   */
  checkColumn(gridID, cellID, prevValue) {
    const columnID = this.getColumnID(gridID, cellID);

    // Get the three adjacent gridIDs from top to bottom in the column
    const adjacentColumnGridIDs = Array.from([0, 1, 2], x => (gridID % 3) + (x * 3));

    // Get the three adjacent cell IDs from top to bottom
    const adjacentCellIDs = Array.from([0, 1, 2], x => (cellID % 3) + (x * 3));

    let numbers = new Set();
    let prevValueCounter = 0;

    // Invalidate the row later if duplicate numbers are to be found.
    this.columns[columnID] = true;

    for (let columnGridID of adjacentColumnGridIDs) {
      for (let columnCellID of adjacentCellIDs) {
        const value = this.grids[columnGridID].cells[columnCellID].value;

        if (value === prevValue) {
          prevValueCounter += 1;
        }

        // Duplicate found, so mark this column invalid
        if (numbers.has(value)) {
          // Emit an INVALIDATE_COLUMN event passing along the affected column and the duplicated value
          GameDispatcher.emit(GameConstants.INVALIDATE_COLUMN, columnID, value);

          this.columns[columnID] = false;
        }

        if (value !== null) {
          numbers.add(value);
        }
      }
    }

    // If only 0 or 1 cells with prevValue were found, column grid is valid now for that particular value
    if (prevValueCounter <= 1) {
      GameDispatcher.emit(GameConstants.VALIDATE_COLUMN, columnID, prevValue);
    }
  }

  /**
   * Checks if the game has been won by verifying that all grids are complete and all rows and columns are valid.
   * If so, emits the corresponding event.
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
    objectAssign(this.grids[0].cells[0], {editable: false, value: 5});
    objectAssign(this.grids[0].cells[1], {editable: false, value: 3});
    objectAssign(this.grids[0].cells[3], {editable: false, value: 6});
    objectAssign(this.grids[0].cells[7], {editable: false, value: 9});
    objectAssign(this.grids[0].cells[8], {editable: false, value: 8});

    objectAssign(this.grids[1].cells[1], {editable: false, value: 7});
    objectAssign(this.grids[1].cells[3], {editable: false, value: 1});
    objectAssign(this.grids[1].cells[4], {editable: false, value: 9});
    objectAssign(this.grids[1].cells[5], {editable: false, value: 5});

    objectAssign(this.grids[2].cells[7], {editable: false, value: 6});

    objectAssign(this.grids[3].cells[0], {editable: false, value: 8});
    objectAssign(this.grids[3].cells[3], {editable: false, value: 4});
    objectAssign(this.grids[3].cells[6], {editable: false, value: 7});

    objectAssign(this.grids[4].cells[1], {editable: false, value: 6});
    objectAssign(this.grids[4].cells[3], {editable: false, value: 8});
    objectAssign(this.grids[4].cells[5], {editable: false, value: 3});
    objectAssign(this.grids[4].cells[7], {editable: false, value: 2});

    objectAssign(this.grids[5].cells[2], {editable: false, value: 3});
    objectAssign(this.grids[5].cells[5], {editable: false, value: 1});
    objectAssign(this.grids[5].cells[8], {editable: false, value: 6});

    objectAssign(this.grids[6].cells[1], {editable: false, value: 6});

    objectAssign(this.grids[7].cells[3], {editable: false, value: 4});
    objectAssign(this.grids[7].cells[4], {editable: false, value: 1});
    objectAssign(this.grids[7].cells[5], {editable: false, value: 9});
    objectAssign(this.grids[7].cells[7], {editable: false, value: 8});

    objectAssign(this.grids[8].cells[0], {editable: false, value: 2});
    objectAssign(this.grids[8].cells[1], {editable: false, value: 8});
    objectAssign(this.grids[8].cells[5], {editable: false, value: 5});
    objectAssign(this.grids[8].cells[7], {editable: false, value: 7});
    objectAssign(this.grids[8].cells[8], {editable: false, value: 9});
  }
}

module.exports = Game;
